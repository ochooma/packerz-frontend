import type { PrintType } from '@/types/package';

type Props = {
  value?: PrintType;
  onChange: (v: PrintType) => void;
};

const OPTIONS: Array<{ v: PrintType; title: string; desc: string }> = [
  { v: 'NP', title: '인쇄 없음', desc: '무지/원단 상태' },
  { v: '4C', title: '단면 4도', desc: '외부 1면 컬러 인쇄' },
  { v: '4C2', title: '양면 4도', desc: '내/외부 인쇄(비용 상승)' },
];

export function StepPrint({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-base font-semibold">인쇄 방식을 선택해 주세요</h2>
      <p className="mt-1 text-sm text-gray-600">특수 인쇄(박/형압/별색)는 검수 단계에서 상담 후 진행됩니다.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const selected = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={[
                'rounded-2xl border p-4 text-left transition',
                selected ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-gray-200 hover:border-gray-300',
              ].join(' ')}
            >
              <div className="text-sm font-semibold">{o.title}</div>
              <div className="mt-1 text-xs text-gray-600">{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}