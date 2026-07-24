"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PayMethod = "card" | "bank_transfer" | "virtual_account";

function methodLabel(m: PayMethod | null) {
  if (m === "card") return "카드";
  if (m === "bank_transfer") return "실시간 계좌이체";
  if (m === "virtual_account") return "가상계좌";
  return "—";
}

export default function PayPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // review에서 넘겨주는 키가 id일 수도 / orderId일 수도 있어서 둘 다 지원
  const orderId = sp.get("orderId") ?? sp.get("id");

  // ✅ review에서 결제수단을 선택했다고 가정하고, 여기선 “표시만”
  const method = (sp.get("method") as PayMethod | null) ?? null;

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const buyer = useMemo(() => draft?.payload?.buyer ?? null, [draft]);
  const tax = useMemo(() => draft?.payload?.tax ?? null, [draft]);

  useEffect(() => {
    if (!orderId) {
      setErr("주문 ID가 없습니다. 이전 단계에서 다시 진행해주세요.");
      setLoading(false);
      return;
    }

    if (!method) {
      setErr("결제수단 정보가 없습니다. 이전 단계에서 다시 진행해주세요.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/orders/draft?id=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });

        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Draft load failed");

        setDraft(json);
      } catch (e: any) {
        setErr(e?.message ?? "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, method]);

  async function onPay() {
    if (!orderId || !method) return;

    // ✅ 오늘: 모의 결제(완료 페이지로 이동)
    // ✅ 내일: 여기서 PG 결제 요청 생성 + 결제창 호출로 교체
    router.push(`/order/complete?id=${encodeURIComponent(orderId)}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">결제</h1>
      <p className="mt-2 text-sm text-neutral-600">
        주문 내용을 확인한 뒤 결제를 진행하세요. (현재는 테스트 화면입니다)
      </p>

      {loading && (
        <div className="mt-6 rounded-2xl border bg-white p-5">불러오는 중…</div>
      )}

      {err && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && draft && (
        <>
          {/* 주문 요약 */}
          <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">주문 요약</h2>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="text-neutral-600">주문번호</div>
              <div className="font-mono">{orderId}</div>

              <div className="mt-3 text-neutral-600">결제수단</div>
              <div className="font-medium">{methodLabel(method)}</div>

              <div className="mt-3 text-neutral-600">주문자</div>
              <div>
                {buyer?.name ?? "—"} / {buyer?.phone ?? "—"} / {buyer?.email ?? "—"}
              </div>

              <div className="mt-3 text-neutral-600">세금증빙</div>
              <div>{tax?.title ?? "—"}</div>
            </div>
          </section>

          {/* 하단 버튼 */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              className="h-11 rounded-2xl border px-4 text-sm font-medium"
              onClick={() => router.back()}
            >
              이전
            </button>
            <button
              type="button"
              className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white"
              onClick={onPay}
            >
              결제하기(테스트)
            </button>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            * 오늘은 “결제 페이지에서 요약 확인 → 완료 페이지 이동”까지만. 내일 PG 연동으로 교체합니다.
          </p>
        </>
      )}
    </div>
  );
}