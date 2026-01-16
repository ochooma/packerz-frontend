'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PackageConfig } from '@/types/package';
import { buildPackageSku } from '@/lib/sku/packageSku';
import { estimatePackagePrice, formatKRW } from '@/lib/pricing/packagePricing';
import { clearDraft } from '@/lib/draft/packageDraft';

type Uploaded = { originalName: string; storedName: string; size: number; mime: string };

export default function PackageReviewPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<{ draft: PackageConfig; notes: string; uploaded: Uploaded[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('pkg_review_v1');
    if (!raw) return router.replace('/package/upload');
    setPayload(JSON.parse(raw));
  }, [router]);

  const sku = useMemo(() => (payload ? buildPackageSku(payload.draft) : null), [payload]);
  const estimate = useMemo(() => (payload ? estimatePackagePrice(payload.draft) : null), [payload]);

  async function submit() {
    if (!payload) return;
    setBusy(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sku, config: payload.draft, notes: payload.notes, estimate, files: payload.uploaded }),
      });
      if (!res.ok) throw new Error('create order failed');
      const data = await res.json();

      sessionStorage.removeItem('pkg_review_v1');
      clearDraft();
      router.push(`/order/complete?id=${encodeURIComponent(data.order.id)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!payload) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold">최종 확인</h1>
      <p className="mt-1 text-sm text-gray-600">검수 후 확정 견적을 안내드립니다.</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold">SKU</div>
        <div className="mt-1 font-mono text-sm">{sku ?? '—'}</div>

        <div className="mt-5 rounded-xl bg-gray-50 p-4">
          <div className="text-xs text-gray-600">예상 제작 비용</div>
          <div className="mt-1 text-lg font-semibold">
            {estimate ? `₩ ${formatKRW(estimate.min)} ~ ${formatKRW(estimate.max)}` : '—'}
          </div>
          <div className="mt-2 text-xs text-gray-600">※ 도면/사양 검수 후 확정됩니다.</div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold">업로드 파일</div>
          <ul className="mt-2 space-y-2 text-sm">
            {payload.uploaded.map((f, i) => (
              <li key={i} className="rounded-xl border border-gray-200 px-3 py-2">{f.originalName}</li>
            ))}
          </ul>
        </div>

        {payload.notes && (
          <div className="mt-6">
            <div className="text-sm font-semibold">요청사항</div>
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">{payload.notes}</div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <button onClick={() => router.back()} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">이전</button>
          <button
            disabled={busy}
            onClick={submit}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? '생성 중…' : '주문/견적 요청하기'}
          </button>
        </div>
      </div>
    </div>
  );
}