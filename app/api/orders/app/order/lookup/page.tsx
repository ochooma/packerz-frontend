"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderLookupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onLookup() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("조회 요청이 실패했습니다.");
        return;
      }
      if (!data.found) {
        setMsg("일치하는 주문을 찾지 못했습니다. 이메일/휴대폰을 확인해주세요.");
        return;
      }
      router.push(`/order/status?id=${encodeURIComponent(data.order.id)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold text-white">비회원 주문 조회</h1>
        <p className="mt-2 text-sm text-slate-300">주문 시 입력한 이메일과 휴대폰 번호로 조회합니다.</p>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-900">이메일</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예: ochooma@gmail.com"
            />
          </label>

          <label className="mt-4 grid gap-1">
            <span className="text-sm font-medium text-slate-900">휴대폰</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 010-1234-5678"
            />
          </label>

          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="h-11 rounded-2xl bg-black px-5 text-sm font-semibold text-white"
              onClick={onLookup}
              disabled={loading}
            >
              {loading ? "조회 중..." : "주문 조회"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}