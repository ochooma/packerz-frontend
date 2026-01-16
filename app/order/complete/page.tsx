'use client';
import { useSearchParams } from 'next/navigation';

export default function OrderCompletePage() {
  const sp = useSearchParams();
  const id = sp.get('id');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">접수 완료</h1>
      <p className="mt-3 text-sm text-gray-600">검수 후 확정 견적을 안내드릴게요.</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
        <div className="text-xs text-gray-500">주문번호</div>
        <div className="mt-1 font-mono text-lg">{id ?? '—'}</div>
      </div>

      <div className="mt-8">
        <a className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white" href="/package/configure">
          새 주문 시작
        </a>
      </div>
    </div>
  );
}