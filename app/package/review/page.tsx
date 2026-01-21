'use client';

<<<<<<< HEAD
import { UI, button, cn } from "@/src/ui-rules";
=======
import { UI, button, cn } from '@/src/ui-rules';
>>>>>>> a504d22 (wip: local ui tweaks before pull)
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type TaxDocType = 'none' | 'tax_invoice' | 'cash_receipt';
type CashReceiptType = 'personal' | 'business';

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
<<<<<<< HEAD

function isBizNo(v: string) {
  // 사업자등록번호 10자리(숫자만) 123-45-67890 형태도 허용
  const digits = v.replace(/[^0-9]/g, '');
  return digits.length === 10;
}

=======
function isBizNo(v: string) {
  const digits = v.replace(/[^0-9]/g, '');
  return digits.length === 10;
}
>>>>>>> a504d22 (wip: local ui tweaks before pull)
function isPhoneKR(v: string) {
  const digits = v.replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

export default function PackageReviewPage() {
  const router = useRouter();
<<<<<<< HEAD

  // 주문자 기본정보(오늘은 최소만)
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // 세금증빙(필수)
  const [taxDocType, setTaxDocType] = useState<TaxDocType>('none');

  // 세금계산서
  const [tiBizNo, setTiBizNo] = useState('');
  const [tiCompany, setTiCompany] = useState('');
  const [tiCeoName, setTiCeoName] = useState('');
  const [tiEmail, setTiEmail] = useState('');
  const [tiAddress, setTiAddress] = useState('');

  // 현금영수증
  const [crType, setCrType] = useState<CashReceiptType>('personal');
  const [crValue, setCrValue] = useState(''); // personal: 휴대폰, business: 사업자번호

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

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

    // 타입별 필수 입력 검증
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

  // ✅ 여기만 “draft 저장 → /pay 이동”으로 교체됨
  async function onNext() {
    if (busy) return;
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = {
        buyer: { name: buyerName.trim(), phone: buyerPhone.trim(), email: buyerEmail.trim() },
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
              ? {
                  type: crType,
                  value: crValue.trim(),
                }
              : null,
        },
      };

      const res = await fetch('/api/orders/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) {
        throw new Error(data?.message || 'draft save failed');
      }

      router.push(`/pay?id=${encodeURIComponent(data.id)}`);
    } catch (e: any) {
      alert(e?.message ?? '임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
=======

  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  const [taxDocType, setTaxDocType] = useState<TaxDocType>('none');

  const [tiBizNo, setTiBizNo] = useState('');
  const [tiCompany, setTiCompany] = useState('');
  const [tiCeoName, setTiCeoName] = useState('');
  const [tiEmail, setTiEmail] = useState('');
  const [tiAddress, setTiAddress] = useState('');

  const [crType, setCrType] = useState<CashReceiptType>('personal');
  const [crValue, setCrValue] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

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
>>>>>>> a504d22 (wip: local ui tweaks before pull)
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

<<<<<<< HEAD
<<<<<<< HEAD
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">주문 정보</h1>
      <p className="mt-2 text-sm text-neutral-600">
        비회원 주문입니다. 결제 완료 후 이메일/휴대폰으로 주문 조회가 가능합니다.
      </p>

      {/* 주문자 */}
      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">주문자 정보</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">이름</span>
            <input
              className="h-11 rounded-xl border px-3"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="예: 박문웅"
            />
            {errors.buyerName && <span className="text-xs text-red-600">{errors.buyerName}</span>}
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">휴대폰</span>
            <input
              className="h-11 rounded-xl border px-3"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="예: 010-1234-5678"
            />
            {errors.buyerPhone && <span className="text-xs text-red-600">{errors.buyerPhone}</span>}
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">이메일</span>
            <input
              className="h-11 rounded-xl border px-3"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="예: ochooma@gmail.com"
            />
            {errors.buyerEmail && <span className="text-xs text-red-600">{errors.buyerEmail}</span>}
          </label>
        </div>
      </section>

      {/* 세금증빙 */}
      <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">세금 증빙 (필수 선택)</h2>
        <p className="mt-1 text-sm text-neutral-600">결제 단계에서 선택한 증빙으로 발행됩니다.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
              taxDocType === 'none' ? 'border-black' : 'border-neutral-200'
            }`}
            onClick={() => setTaxDocType('none')}
          >
            발행 안함
          </button>

          <button
            type="button"
            className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
              taxDocType === 'tax_invoice' ? 'border-black' : 'border-neutral-200'
            }`}
            onClick={() => setTaxDocType('tax_invoice')}
          >
            세금계산서
          </button>

          <button
            type="button"
            className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
              taxDocType === 'cash_receipt' ? 'border-black' : 'border-neutral-200'
            }`}
            onClick={() => setTaxDocType('cash_receipt')}
          >
            현금영수증
          </button>
        </div>

        {/* 세금계산서 폼 */}
        {taxDocType === 'tax_invoice' && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium">사업자등록번호</span>
              <input
                className="h-11 rounded-xl border px-3"
                value={tiBizNo}
                onChange={(e) => setTiBizNo(e.target.value)}
                placeholder="예: 123-45-67890"
              />
              {errors.tiBizNo && <span className="text-xs text-red-600">{errors.tiBizNo}</span>}
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">상호</span>
              <input
                className="h-11 rounded-xl border px-3"
                value={tiCompany}
                onChange={(e) => setTiCompany(e.target.value)}
                placeholder="예: 피케이씨컴퍼니"
              />
              {errors.tiCompany && <span className="text-xs text-red-600">{errors.tiCompany}</span>}
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">대표자명</span>
              <input
                className="h-11 rounded-xl border px-3"
                value={tiCeoName}
                onChange={(e) => setTiCeoName(e.target.value)}
                placeholder="예: 박문웅"
              />
              {errors.tiCeoName && <span className="text-xs text-red-600">{errors.tiCeoName}</span>}
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">수신 이메일</span>
              <input
                className="h-11 rounded-xl border px-3"
                value={tiEmail}
                onChange={(e) => setTiEmail(e.target.value)}
                placeholder="예: accounting@company.com"
              />
              {errors.tiEmail && <span className="text-xs text-red-600">{errors.tiEmail}</span>}
            </label>

            <label className="grid gap-1 sm:col-span-2">
              <span className="text-sm font-medium">사업장 주소</span>
              <input
                className="h-11 rounded-xl border px-3"
                value={tiAddress}
                onChange={(e) => setTiAddress(e.target.value)}
                placeholder="예: 서울시 …"
              />
              {errors.tiAddress && <span className="text-xs text-red-600">{errors.tiAddress}</span>}
            </label>
=======
  function onNext() {
    if (!validate()) return;
=======
  async function onNext() {
  if (busy) return;
  if (!validate()) return;
>>>>>>> 34aa409 (fix: move draft API route to correct Next.js app router path)

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

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`draft api failed: ${text}`);
    }

    const data = await res.json();
    if (!data?.id) {
      throw new Error('draft api response missing id');
    }

    router.push(`/pay?draftId=${encodeURIComponent(data.id)}`);
  } catch (e: any) {
    alert(e?.message ?? '임시 주문 저장에 실패했습니다.');
  } finally {
    setBusy(false);
  }
}

  const choiceBtn = (active: boolean) =>
    cn(UI.choice, 'text-slate-900', active && 'border-slate-900 ring-2 ring-slate-300');

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className={UI.h1 + ' text-white'}>주문 정보</h1>
        <p className={cn('mt-2', UI.sub, 'text-slate-300')}>비회원 주문입니다. 결제 완료 후 이메일/휴대폰으로 주문 조회가 가능합니다.</p>

        {/* 주문자 */}
        <section className={cn(UI.card, 'mt-8')}>
          <div className={UI.cardHeader}>
            <h2 className={UI.h2}>주문자 정보</h2>
            <p className={UI.sub}>확인/알림을 위해 연락처와 이메일을 정확히 입력해주세요.</p>
          </div>

          <div className={UI.cardBody}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className={UI.label}>이름</span>
                <input className={UI.input} value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="예: 김문선" />
                {errors.buyerName && <span className={UI.danger}>{errors.buyerName}</span>}
              </label>

              <label className="grid gap-1">
                <span className={UI.label}>휴대폰</span>
                <input className={UI.input} value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="예: 010-1234-5678" />
                {errors.buyerPhone && <span className={UI.danger}>{errors.buyerPhone}</span>}
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className={UI.label}>이메일</span>
                <input className={UI.input} value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="예: cs@packerz.co.kr" />
                {errors.buyerEmail && <span className={UI.danger}>{errors.buyerEmail}</span>}
              </label>
            </div>
>>>>>>> a504d22 (wip: local ui tweaks before pull)
          </div>
        </section>

<<<<<<< HEAD
        {/* 현금영수증 폼 */}
        {taxDocType === 'cash_receipt' && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium">발행 유형</span>
              <select
                className="h-11 rounded-xl border px-3"
                value={crType}
                onChange={(e) => setCrType(e.target.value as CashReceiptType)}
              >
                <option value="personal">개인(휴대폰)</option>
                <option value="business">사업자(사업자번호)</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">{crType === 'personal' ? '휴대폰 번호' : '사업자등록번호'}</span>
              <input
                className="h-11 rounded-xl border px-3"
                value={crValue}
                onChange={(e) => setCrValue(e.target.value)}
                placeholder={crType === 'personal' ? '예: 010-1234-5678' : '예: 123-45-67890'}
              />
              {errors.crValue && <span className="text-xs text-red-600">{errors.crValue}</span>}
            </label>
          </div>
        )}
      </section>

      {/* 하단 버튼 */}
      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          type="button"
          className="h-11 rounded-2xl border px-4 text-sm font-medium"
          onClick={() => router.back()}
          disabled={busy}
        >
          이전
        </button>

        <button
          type="button"
          className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-60"
          onClick={onNext}
          disabled={busy}
        >
          {busy ? '저장 중…' : '결제 단계로'}
        </button>
=======
        {/* 세금증빙 */}
        <section className={cn(UI.card, 'mt-6')}>
          <div className={UI.cardHeader}>
            <h2 className={UI.h2}>세금 증빙 (필수 선택)</h2>
            <p className={UI.sub}>결제 단계에서 선택한 증빙으로 발행됩니다.</p>
          </div>

          <div className={UI.cardBody}>
            <div className={UI.choiceGroup}>
              <button type="button" className={choiceBtn(taxDocType === 'none')} onClick={() => setTaxDocType('none')}>
                발행 안함
              </button>
              <button type="button" className={choiceBtn(taxDocType === 'tax_invoice')} onClick={() => setTaxDocType('tax_invoice')}>
                세금계산서
              </button>
              <button type="button" className={choiceBtn(taxDocType === 'cash_receipt')} onClick={() => setTaxDocType('cash_receipt')}>
                현금영수증
              </button>
            </div>

            {taxDocType === 'tax_invoice' && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className={UI.label}>사업자등록번호</span>
                  <input className={UI.input} value={tiBizNo} onChange={(e) => setTiBizNo(e.target.value)} placeholder="예: 123-45-67890" />
                  {errors.tiBizNo && <span className={UI.danger}>{errors.tiBizNo}</span>}
                </label>

                <label className="grid gap-1">
                  <span className={UI.label}>상호</span>
                  <input className={UI.input} value={tiCompany} onChange={(e) => setTiCompany(e.target.value)} placeholder="예: 피케이씨컴퍼니" />
                  {errors.tiCompany && <span className={UI.danger}>{errors.tiCompany}</span>}
                </label>

                <label className="grid gap-1">
                  <span className={UI.label}>대표자명</span>
                  <input className={UI.input} value={tiCeoName} onChange={(e) => setTiCeoName(e.target.value)} placeholder="예: 박문웅" />
                  {errors.tiCeoName && <span className={UI.danger}>{errors.tiCeoName}</span>}
                </label>

                <label className="grid gap-1">
                  <span className={UI.label}>수신 이메일</span>
                  <input className={UI.input} value={tiEmail} onChange={(e) => setTiEmail(e.target.value)} placeholder="예: accounting@company.com" />
                  {errors.tiEmail && <span className={UI.danger}>{errors.tiEmail}</span>}
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <span className={UI.label}>사업장 주소</span>
                  <input className={UI.input} value={tiAddress} onChange={(e) => setTiAddress(e.target.value)} placeholder="예: 서울시 …" />
                  {errors.tiAddress && <span className={UI.danger}>{errors.tiAddress}</span>}
                </label>
              </div>
            )}

            {taxDocType === 'cash_receipt' && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className={UI.label}>발행 유형</span>
                  <select className={UI.input} value={crType} onChange={(e) => setCrType(e.target.value as CashReceiptType)}>
                    <option value="personal">개인(휴대폰)</option>
                    <option value="business">사업자(사업자번호)</option>
                  </select>
                </label>

                <label className="grid gap-1">
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
        <div className="mt-8 flex items-center justify-end gap-3">
          <button type="button" className={button({ variant: 'secondary' })} onClick={() => router.back()}>
            이전
          </button>
          <button type="button" className={button({ variant: 'primary' })} onClick={onNext}>
            결제 단계로
          </button>
        </div>

        <p className={cn('mt-4', UI.helper, 'text-slate-400')}>
          * 오늘은 화면/검증까지만. 내일은 이 데이터를 주문 draft API에 저장하고, 결제 연동으로 연결합니다.
        </p>
>>>>>>> a504d22 (wip: local ui tweaks before pull)
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        * 오늘은 화면/검증 + draft 저장 + 결제 단계 이동까지 연결합니다.
      </p>
    </div>
  );
}