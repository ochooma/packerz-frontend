'use client';

import { UI, button, cn } from '@/src/ui-rules';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type TaxDocType = 'none' | 'tax_invoice' | 'cash_receipt';
type CashReceiptType = 'personal' | 'business';

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function isBizNo(v: string) {
  const digits = v.replace(/[^0-9]/g, '');
  return digits.length === 10;
}
function isPhoneKR(v: string) {
  const digits = v.replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

export default function PackageReviewPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);

  // 주문자 기본정보
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // 세금증빙(필수 선택)
  const [taxDocType, setTaxDocType] = useState<TaxDocType>('none');

  // 세금계산서
  const [tiBizNo, setTiBizNo] = useState('');
  const [tiCompany, setTiCompany] = useState('');
  const [tiCeoName, setTiCeoName] = useState('');
  const [tiEmail, setTiEmail] = useState('');
  const [tiAddress, setTiAddress] = useState('');

  // 현금영수증
  const [crType, setCrType] = useState<CashReceiptType>('personal');
  const [crValue, setCrValue] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const taxTitle = useMemo(() => {
    if (taxDocType === 'none') return '발행 안함';
    if (taxDocType === 'tax_invoice') return '세금계산서';
    return '현금영수증';
  }, [taxDocType]);

  function validate() {
    const e: Record<string, string> = {};

    if (!buyerName.trim()) e.buyerName = '주문자 이름을 입력해주세요.';
    if (!buyerPhone.trim() || !isPhoneKR(buyerPhone)) e.buyerPhone = '휴대폰 번호를 확인해주세요.';
    if (!buyerEmail.trim() || !isEmail(buyerEmail)) e.buyerEmail = '이메일을 확인해주세요.';

    if (taxDocType === 'tax_invoice') {
      if (!isBizNo(tiBizNo)) e.tiBizNo = '사업자등록번호(10자리)를 입력해주세요.';
      if (!tiCompany.trim()) e.tiCompany = '상호를 입력해주세요.';
      if (!tiCeoName.trim()) e.tiCeoName = '대표자명을 입력해주세요.';
      if (!tiEmail.trim() || !isEmail(tiEmail)) e.tiEmail = '세금계산서 수신 이메일을 확인해주세요.';
      if (!tiAddress.trim()) e.tiAddress = '사업장 주소를 입력해주세요.';
    }

    if (taxDocType === 'cash_receipt') {
      if (crType === 'personal') {
        if (!crValue.trim() || !isPhoneKR(crValue)) e.crValue = '현금영수증용 휴대폰 번호를 입력해주세요.';
      } else {
        if (!isBizNo(crValue)) e.crValue = '현금영수증용 사업자등록번호(10자리)를 입력해주세요.';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onNext() {
    if (busy) return;
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = {
        buyer: {
          name: buyerName.trim(),
          phone: buyerPhone.trim(),
          email: buyerEmail.trim(),
        },
        tax: {
          type: taxDocType,
          title: taxTitle,
          taxInvoice:
            taxDocType === 'tax_invoice'
              ? {
                  bizNo: tiBizNo.trim(),
                  company: tiCompany.trim(),
                  ceoName: tiCeoName.trim(),
                  email: tiEmail.trim(),
                  address: tiAddress.trim(),
                }
              : null,
          cashReceipt:
            taxDocType === 'cash_receipt'
              ? { type: crType, value: crValue.trim() }
              : null,
        },
      };

      const res = await fetch('/api/orders/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 404/500면 HTML이 올 수 있어서 방어
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`draft api failed: ${text.slice(0, 120)}`);
      }

      if (!res.ok || !data) throw new Error(data?.error || 'draft save failed');

      const orderId = data.orderId || data.id;
      if (!orderId) throw new Error('draft response missing orderId');

      // pay 페이지에서 쓰도록 보관(옵션)
      sessionStorage.setItem(
        'pay_ctx_v1',
        JSON.stringify({
          orderId,
          buyer: payload.buyer,
          tax: payload.tax,
          createdAt: new Date().toISOString(),
        })
      );

      router.push(`/pay?orderId=${encodeURIComponent(orderId)}`);
    } catch (e: any) {
      alert(e?.message ?? '임시 주문 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const SegBtn = (props: { on: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button
      type="button"
      className={cn(UI.segBase, props.on ? UI.segOn : UI.segIdle)}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );

  return (
    <div className={UI.page}>
      <h1 className={UI.pageTitle}>주문 정보</h1>
      <p className={UI.pageDesc}>비회원 주문입니다. 결제 완료 후 이메일/휴대폰으로 주문 조회가 가능합니다.</p>

      {/* 주문자 */}
      <section className={UI.card}>
        <div className={UI.cardHead}>
          <div className={UI.cardTitle}>주문자 정보</div>
          <div className={UI.cardSub}>확인/알림을 위해 연락처와 이메일을 정확히 입력해주세요.</div>
        </div>

        <div className={UI.cardBody}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={UI.label}>이름</span>
              <input
                className={UI.input}
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="예: 박문웅"
              />
              {errors.buyerName && <span className={UI.danger}>{errors.buyerName}</span>}
            </label>

            <label className="grid gap-2">
              <span className={UI.label}>휴대폰</span>
              <input
                className={UI.input}
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="예: 010-1234-5678"
              />
              {errors.buyerPhone && <span className={UI.danger}>{errors.buyerPhone}</span>}
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className={UI.label}>이메일</span>
              <input
                className={UI.input}
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="예: cs@packerz.co.kr"
              />
              {errors.buyerEmail && <span className={UI.danger}>{errors.buyerEmail}</span>}
            </label>
          </div>
        </div>
      </section>

      {/* 세금증빙 */}
      <section className={UI.card}>
        <div className={UI.cardHead}>
          <div className={UI.cardTitle}>세금 증빙 (필수 선택)</div>
          <div className={UI.cardSub}>결제 단계에서 선택한 증빙으로 발행됩니다.</div>
        </div>

        <div className={UI.cardBody}>
          <div className="grid gap-3 sm:grid-cols-3">
            <SegBtn on={taxDocType === 'none'} onClick={() => setTaxDocType('none')}>
              발행 안함
            </SegBtn>
            <SegBtn on={taxDocType === 'tax_invoice'} onClick={() => setTaxDocType('tax_invoice')}>
              세금계산서
            </SegBtn>
            <SegBtn on={taxDocType === 'cash_receipt'} onClick={() => setTaxDocType('cash_receipt')}>
              현금영수증
            </SegBtn>
          </div>

          {taxDocType === 'tax_invoice' && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className={UI.label}>사업자등록번호</span>
                <input
                  className={UI.input}
                  value={tiBizNo}
                  onChange={(e) => setTiBizNo(e.target.value)}
                  placeholder="예: 123-45-67890"
                />
                {errors.tiBizNo && <span className={UI.danger}>{errors.tiBizNo}</span>}
              </label>

              <label className="grid gap-2">
                <span className={UI.label}>상호</span>
                <input
                  className={UI.input}
                  value={tiCompany}
                  onChange={(e) => setTiCompany(e.target.value)}
                  placeholder="예: 주식회사 문선"
                />
                {errors.tiCompany && <span className={UI.danger}>{errors.tiCompany}</span>}
              </label>

              <label className="grid gap-2">
                <span className={UI.label}>대표자명</span>
                <input
                  className={UI.input}
                  value={tiCeoName}
                  onChange={(e) => setTiCeoName(e.target.value)}
                  placeholder="예: 김문선"
                />
                {errors.tiCeoName && <span className={UI.danger}>{errors.tiCeoName}</span>}
              </label>

              <label className="grid gap-2">
                <span className={UI.label}>수신 이메일</span>
                <input
                  className={UI.input}
                  value={tiEmail}
                  onChange={(e) => setTiEmail(e.target.value)}
                  placeholder="예: accounting@company.com"
                />
                {errors.tiEmail && <span className={UI.danger}>{errors.tiEmail}</span>}
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className={UI.label}>사업장 주소</span>
                <input
                  className={UI.input}
                  value={tiAddress}
                  onChange={(e) => setTiAddress(e.target.value)}
                  placeholder="예: 서울시 …"
                />
                {errors.tiAddress && <span className={UI.danger}>{errors.tiAddress}</span>}
              </label>
            </div>
          )}

          {taxDocType === 'cash_receipt' && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className={UI.label}>발행 유형</span>
                <select className={UI.select} value={crType} onChange={(e) => setCrType(e.target.value as CashReceiptType)}>
                  <option value="personal">개인(휴대폰)</option>
                  <option value="business">사업자(사업자번호)</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className={UI.label}>{crType === 'personal' ? '휴대폰 번호' : '사업자등록번호'}</span>
                <input
                  className={UI.input}
                  value={crValue}
                  onChange={(e) => setCrValue(e.target.value)}
                  placeholder={crType === 'personal' ? '예: 010-1234-5678' : '예: 123-45-67890'}
                />
                {errors.crValue && <span className={UI.danger}>{errors.crValue}</span>}
              </label>
            </div>
          )}
        </div>
      </section>

      {/* 하단 버튼 */}
      <div className="mt-10 flex items-center justify-end gap-3">
        <button type="button" className={button({ variant: 'secondary', disabled: busy })} onClick={() => router.back()}>
          이전
        </button>
        <button type="button" className={button({ variant: 'primary', disabled: busy })} onClick={onNext}>
          {busy ? '저장 중…' : '결제 단계로'}
        </button>
      </div>

      <p className="mt-4 text-xs text-white/60">* 오늘은 draft 저장 → 결제 페이지 이동까지 연결합니다.</p>
    </div>
  );
}