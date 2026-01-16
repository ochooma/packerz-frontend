import type { SizeBasis } from '@/types/package';

type Props = {
  value?: { w?: number; d?: number; h?: number; basis?: SizeBasis };
  onChange: (patch: { w?: number; d?: number; h?: number; basis?: SizeBasis }) => void;
};

const PRESETS = [
  { w: 100, d: 50, h: 30 },
  { w: 150, d: 100, h: 50 },
  { w: 120, d: 80, h: 40 },
];

export function StepSize({ value, onChange }: Props) {
  const w = value?.w ?? '';
  const d = value?.d ?? '';
  const h = value?.h ?? '';
  const basis = value?.basis ?? 'internal';

  return (
    <div>
      <h2 className="text-base font-semibold">패키지 사이즈를 입력해 주세요</h2>
      <p className="mt-1 text-sm text-gray-600">완성 기준(mm). 도면 템플릿을 내려받아 작업해 주세요.</p>

      <div className="mt-4">
        <div className="text-xs text-gray-500">인기 사이즈</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange({ w: p.w, d: p.d, h: p.h })}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              {p.w}×{p.d}×{p.h}mm
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field
          label="가로(W)"
          value={w}
          onValue={(n) => onChange({ w: n })}
        />
        <Field
          label="세로(D)"
          value={d}
          onValue={(n) => onChange({ d: n })}
        />
        <Field
          label="높이(H)"
          value={h}
          onValue={(n) => onChange({ h: n })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">기준</span>
        <Radio
          label="내경"
          checked={basis === 'internal'}
          onClick={() => onChange({ basis: 'internal' })}
        />
        <Radio
          label="외경"
          checked={basis === 'external'}
          onClick={() => onChange({ basis: 'external' })}
        />
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <div className="font-medium">도면 템플릿 안내</div>
        <div className="mt-1 text-xs text-gray-600 leading-relaxed">
          사이즈 기준은 접지 후 완성 사이즈입니다. 정확한 제작을 위해 템플릿 위에 디자인 후 업로드해 주세요.
        </div>
        <div className="mt-3">
          <a
            href="/package/template"
            className="inline-flex rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100"
          >
            도면 템플릿 다운로드 →
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onValue,
}: {
  label: string;
  value: number | '' ;
  onValue: (n?: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (v === '') return onValue(undefined);
            const n = Number(v);
            if (Number.isFinite(n)) onValue(n);
          }}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
          placeholder="0"
        />
        <span className="text-xs text-gray-500">mm</span>
      </div>
    </label>
  );
}

function Radio({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1 text-xs',
        checked ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ].join(' ')}
    >
      {label}
    </button>
  );
}