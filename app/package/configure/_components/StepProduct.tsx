import type { PackageType } from '@/types/package';

type Props = {
  value?: PackageType;
  onChange: (v: PackageType) => void;
};

const OPTIONS: Array<{ v: PackageType; title: string; desc: string; moq: string }> = [
  { v: 'FC', title: '단상자', desc: '가장 일반적인 제품 박스', moq: 'MOQ 300개~' },
  { v: 'SL', title: '슬리브', desc: '간단한 구조의 슬리브형', moq: 'MOQ 300개~' },
  { v: 'RSC', title: '배송박스', desc: '택배/물류용 골판지 박스', moq: 'MOQ 100개~' },
];

export function StepProduct({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-base font-semibold">어떤 패키지를 제작하시나요?</h2>
      <p className="mt-1 text-sm text-gray-600">제품 타입을 선택하면 다음 단계로 진행할 수 있어요.</p>

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
              <div className="mt-3 text-xs text-gray-500">{o.moq}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}