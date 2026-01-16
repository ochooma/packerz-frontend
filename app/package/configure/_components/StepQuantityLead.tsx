import type { LeadTime } from '@/types/package';

type Props = {
  value: { quantity?: number; lead?: LeadTime };
  onChange: (patch: { quantity?: number; lead?: LeadTime }) => void;
};

export function StepQuantityLead({ value, onChange }: Props) {
  const qty = value.quantity ?? '';
  const lead = value.lead ?? 'STD';

  return (
    <div>
      <h2 className="text-base font-semibold">수량과 납기를 선택해 주세요</h2>
      <p className="mt-1 text-sm text-gray-600">예상가는 참고용이며, 검수 후 확정됩니다.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <div className="text-xs text-gray-500">수량</div>
          <div className="mt-1 flex items-center gap-2">
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v === '') return onChange({ quantity: undefined });
                const n = Number(v);
                if (Number.isFinite(n)) onChange({ quantity: n });
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              placeholder="예: 1000"
            />
            <span className="text-xs text-gray-500">개</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">최소 수량(MOQ)은 제품/사양에 따라 달라질 수 있어요.</div>
        </label>

        <div>
          <div className="text-xs text-gray-500">납기</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ lead: 'STD' })}
              className={[
                'flex-1 rounded-xl px-3 py-2 text-sm',
                lead === 'STD' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ].join(' ')}
            >
              일반
            </button>
            <button
              type="button"
              onClick={() => onChange({ lead: 'EXP' })}
              className={[
                'flex-1 rounded-xl px-3 py-2 text-sm',
                lead === 'EXP' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ].join(' ')}
            >
              급행
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500">급행은 추가 비용이 발생할 수 있습니다.</div>
        </div>
      </div>
    </div>
  );
}