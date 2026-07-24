"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TaxDocType = "none" | "tax_invoice" | "cash_receipt";
type CashReceiptType = "personal" | "business";
type PayMethod = "card" | "bank_transfer" | "virtual_account";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isBizNo(v: string) {
  const digits = v.replace(/[^0-9]/g, "");
  return digits.length === 10;
}

function isPhoneKR(v: string) {
  const digits = v.replace(/[^0-9]/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function methodLabel(m: PayMethod) {
  if (m === "card") return "카드";
  if (m === "bank_transfer") return "실시간 계좌이체";
  return "가상계좌";
}

export default function PackageReviewPage() {
  const router = useRouter();

  // 주문자 기본정보
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  // 세금증빙(필수 선택 UI, 기본값은 발행 안함)
  const [taxDocType, setTaxDocType] = useState<TaxDocType>("none");

  // 세금계산서
  const [tiBizNo, setTiBizNo] = useState("");
  const [tiCompany, setTiCompany] = useState("");
  const [tiCeoName, setTiCeoName] = useState("");
  const [tiEmail, setTiEmail] = useState("");
  const [tiAddress, setTiAddress] = useState("");

  // 현금영수증
  const [crType, setCrType] = useState<CashReceiptType>("personal");
  const [crValue, setCrValue] = useState(""); // personal: 휴대폰, business: 사업자번호

  // ✅ 결제수단: 1개만 선택 (라디오)
  const [payMethod, setPayMethod] = useState<PayMethod>("card");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const taxTitle = useMemo(() => {
    if (taxDocType === "none") return "발행 안함";
    if (taxDocType === "tax_invoice") return "세금계산서";
    return "현금영수증";
  }, [taxDocType]);

  function validate() {
    const e: Record<string, string> = {};

    if (!buyerName.trim()) e.buyerName = "주문자 이름을 입력해주세요.";
    if (!buyerPhone.trim() || !isPhoneKR(buyerPhone)) e.buyerPhone = "휴대폰 번호를 확인해주세요.";
    if (!buyerEmail.trim() || !isEmail(buyerEmail)) e.buyerEmail = "이메일을 확인해주세요.";

    if (taxDocType === "tax_invoice") {
      if (!isBizNo(tiBizNo)) e.tiBizNo = "사업자등록번호(10자리)를 입력해주세요.";
      if (!tiCompany.trim()) e.tiCompany = "상호를 입력해주세요.";
      if (!tiCeoName.trim()) e.tiCeoName = "대표자명을 입력해주세요.";
      if (!tiEmail.trim() || !isEmail(tiEmail)) e.tiEmail = "세금계산서 수신 이메일을 확인해주세요.";
      if (!tiAddress.trim()) e.tiAddress = "사업장 주소를 입력해주세요.";
    }

    if (taxDocType === "cash_receipt") {
      if (crType === "personal") {
        if (!crValue.trim() || !isPhoneKR(crValue)) e.crValue = "현금영수증용 휴대폰 번호를 입력해주세요.";
      } else {
        if (!isBizNo(crValue)) e.crValue = "현금영수증용 사업자등록번호(10자리)를 입력해주세요.";
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
            taxDocType === "tax_invoice"
              ? {
                  bizNo: tiBizNo.trim(),
                  company: tiCompany.trim(),
                  ceoName: tiCeoName.trim(),
                  email: tiEmail.trim(),
                  address: tiAddress.trim(),
                }
              : null,
          cashReceipt:
            taxDocType === "cash_receipt"
              ? { type: crType, value: crValue.trim() }
              : null,
        },
      };

      // ✅ 1) draft 생성
      const res = await fetch("/api/orders/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`draft api failed: ${t || res.statusText}`);
      }

      // API가 {id}만 줄 수도, {ok:true, orderId, id} 형태일 수도 있어서 둘 다 대응
      const data: any = await res.json().catch(() => ({}));
      const orderId: string | undefined =
        data?.orderId ?? data?.id ?? data?.order?.id ?? data?.result?.id;

      if (!orderId) {
        throw new Error("draft api response missing id/orderId");
      }

      // ✅ 2) 결제 페이지 이동 (결제수단은 query로 넘김)
      router.push(
        `/pay?orderId=${encodeURIComponent(orderId)}&method=${encodeURIComponent(payMethod)}`
      );
    } catch (e: any) {
      alert(e?.message ?? "임시 주문 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

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
              taxDocType === "none" ? "border-black" : "border-neutral-200"
            }`}
            onClick={() => setTaxDocType("none")}
          >
            발행 안함
          </button>

          <button
            type="button"
            className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
              taxDocType === "tax_invoice" ? "border-black" : "border-neutral-200"
            }`}
            onClick={() => setTaxDocType("tax_invoice")}
          >
            세금계산서
          </button>

          <button
            type="button"
            className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
              taxDocType === "cash_receipt" ? "border-black" : "border-neutral-200"
            }`}
            onClick={() => setTaxDocType("cash_receipt")}
          >
            현금영수증
          </button>
        </div>

        {/* 세금계산서 폼 */}
        {taxDocType === "tax_invoice" && (
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
                placeholder="예: 주식회사 문선"
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
          </div>
        )}

        {/* 현금영수증 폼 */}
        {taxDocType === "cash_receipt" && (
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
              <span className="text-sm font-medium">
                {crType === "personal" ? "휴대폰 번호" : "사업자등록번호"}
              </span>
              <input
                className="h-11 rounded-xl border px-3"
                value={crValue}
                onChange={(e) => setCrValue(e.target.value)}
                placeholder={crType === "personal" ? "예: 010-1234-5678" : "예: 123-45-67890"}
              />
              {errors.crValue && <span className="text-xs text-red-600">{errors.crValue}</span>}
            </label>
          </div>
        )}
      </section>

      {/* ✅ 결제수단(여기서 1개만 선택) */}
      <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">결제수단 선택</h2>
        <p className="mt-1 text-sm text-neutral-600">결제는 다음 단계에서 진행합니다.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["card", "bank_transfer", "virtual_account"] as PayMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                payMethod === m ? "border-black" : "border-neutral-200"
              }`}
              onClick={() => setPayMethod(m)}
            >
              {methodLabel(m)}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-neutral-500">선택됨: {methodLabel(payMethod)}</p>
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
          {busy ? "저장 중…" : "결제 단계로"}
        </button>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        * 오늘은 “review → draft 저장 → pay 이동”까지 연결합니다.
      </p>
    </div>
  );
}