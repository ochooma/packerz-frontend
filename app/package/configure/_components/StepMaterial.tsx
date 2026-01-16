import type { Material, PackageType } from '@/types/package';

type Props = {
  packageType?: PackageType;
  value?: Material;
  onChange: (v: Material) => void;
};

function optionsForType(t?: PackageType) {
  if (t === 'RSC') return [{ v: 'EG' as const, title: 'E골 골판지', desc: '배송/물류에 적합' }];
  return [
    { v: 'SC350' as const, title: 'SC마닐라 350g', desc: '가장 일반적인 단상자' },
    { v: 'IV300' as const, title: '아이보리 300g', desc: '인쇄 표현이 깔끔함' },
  ];
}

export function StepMaterial({ packageType, value, onChange }: Props) {
  const options = optionsForType(packageType);

  return (
    <div>
      <h2 className="text-base font-semibold">재질을 선택해 주세요</h2>
      <p className="mt-1 text-sm text-gray-600">Phase 1에서는 핵심 재질만 제공합니다.</p>

      {!packageType && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          먼저 STEP 1에서 제품 타입을 선택해 주세요.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const selected = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              disabled={!packageType}
              className={[
                'rounded-2xl border p-4 text-left transition disabled:opacity-40',
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