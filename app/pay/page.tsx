"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PayMethod = "card" | "bank_transfer" | "virtual_account";

export default function PayPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // 카드 필수 + (추가 선택 가능) 계좌이체/가상계좌
  const [methods, setMethods] = useState<PayMethod[]>(["card"]);

  const buyer = useMemo(() => draft?.payload?.buyer ?? null, [draft]);
  const tax = useMemo(() => draft?.payload?.tax ?? null, [draft]);

  useEffect(() => {
    if (!id) {
      setErr("결제 ID가 없습니다. 이전 단계에서 다시 진행해주세요.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/draft?id=${encodeURIComponent(id)}`, {
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
  }, [id]);

  function toggle(m: PayMethod) {
    // card는 항상 포함
    if (m === "card") return;

    setMethods((prev) => {
      const has = prev.includes(m);
      const next = has ? prev.filter((x) => x !== m) : [...prev, m];
      // 카드 강제 포함
      return next.includes("card") ? next : ["card", ...next];
    });
  }

  async function onPay() {
    // 오늘은 PG 연동 전이므로 "모의 결제"
    // 내일: 여기서 PG 결제창 호출/결제요청 생성 연결
    if (!id) return;
    router.push(`/order/complete?id=${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">결제</h1>
      <p className="mt-2 text-sm text-neutral-600">
        카드 결제는 필수이며, 계좌이체/가상계좌는 추가로 선택 가능합니다.
      </p>

      {loading && (
        <div className="mt-6 rounded-2xl border bg-white p-5">
          불러오는 중…
        </div>
      )}

      {err && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && draft && (
        <>
          <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">주문 요약</h2>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="text-neutral-600">주문번호</div>
              <div className="font-mono">{id}</div>

              <div className="mt-3 text-neutral-600">주문자</div>
              <div>
                {buyer?.name ?? "—"} / {buyer?.phone ?? "—"} / {buyer?.email ?? "—"}
              </div>

              <div className="mt-3 text-neutral-600">세금증빙</div>
              <div>{tax?.title ?? "—"}</div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">결제수단 선택</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                className="h-12 rounded-2xl border border-black px-4 text-sm font-semibold"
                // 카드 필수라 토글 비활성 느낌
                title="카드는 필수입니다"
              >
                카드(필수)
              </button>

              <button
                type="button"
                className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                  methods.includes("bank_transfer") ? "border-black" : "border-neutral-200"
                }`}
                onClick={() => toggle("bank_transfer")}
              >
                실시간 계좌이체(선택)
              </button>

              <button
                type="button"
                className={`h-12 rounded-2xl border px-4 text-sm font-medium ${
                  methods.includes("virtual_account") ? "border-black" : "border-neutral-200"
                }`}
                onClick={() => toggle("virtual_account")}
              >
                가상계좌(선택)
              </button>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              선택된 결제수단: {methods.join(", ")}
            </p>
          </section>

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
            * 오늘은 “결제 단계 UI + draft 연결”까지만. 내일 PG 연동으로 교체합니다.
          </p>
        </>
      )}
    </div>
  );
}
