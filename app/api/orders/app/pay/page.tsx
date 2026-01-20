"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PayMethod = "card" | "va" | "transfer" | "bank";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id");

  const [method, setMethod] = useState<PayMethod>("card");

  const methodLabel = useMemo(() => {
    if (method === "card") return "카드결제(필수)";
    if (method === "va") return "가상계좌";
    if (method === "transfer") return "실시간 계좌이체";
    return "무통장입금(확정 후 안내)";
  }, [method]);

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-white">결제</h1>
        <p className="mt-2 text-sm text-slate-300">
          주문번호: <span className="font-mono">{id ?? "—"}</span>
        </p>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">결제수단</h2>
          <p className="mt-1 text-sm text-slate-700">
            카드는 필수, 추가 옵션(계좌이체/가상계좌/무통장)은 선택 가능
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <button
              type="button"
              className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                method === "card" ? "border-slate-900 ring-2 ring-slate-300" : "border-slate-300"
              }`}
              onClick={() => setMethod("card")}
            >
              카드(필수)
            </button>

            <button
              type="button"
              className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                method === "va" ? "border-slate-900 ring-2 ring-slate-300" : "border-slate-300"
              }`}
              onClick={() => setMethod("va")}
            >
              가상계좌
            </button>

            <button
              type="button"
              className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                method === "transfer" ? "border-slate-900 ring-2 ring-slate-300" : "border-slate-300"
              }`}
              onClick={() => setMethod("transfer")}
            >
              계좌이체
            </button>

            <button
              type="button"
              className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                method === "bank" ? "border-slate-900 ring-2 ring-slate-300" : "border-slate-300"
              }`}
              onClick={() => setMethod("bank")}
            >
              무통장
            </button>
          </div>

          <div className="mt-5 text-sm text-slate-700">
            선택: <b>{methodLabel}</b>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="h-11 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              onClick={() => router.back()}
            >
              이전
            </button>
            <button
              type="button"
              className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={() => alert("다음 단계: PG 연동(카드필수) / 가상계좌/계좌이체 옵션")}
            >
              결제 진행
            </button>
          </div>
        </section>

        <p className="mt-4 text-xs text-slate-400">
          * 현재는 결제 UI 골격만 구현했습니다. 다음 단계에서 PG(카드 필수) + 가상계좌/계좌이체 옵션을 연결합니다.
        </p>
      </div>
    </div>
  );
}

export default function PayPage() {
  // useSearchParams 빌드 안전
  return (
    <Suspense fallback={<div className="p-6 text-white">로딩 중…</div>}>
      <Inner />
    </Suspense>
  );
}