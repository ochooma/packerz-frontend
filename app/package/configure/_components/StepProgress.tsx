type Props = { step: number };

const STEPS = [
  { n: 1, label: '제품' },
  { n: 2, label: '사이즈' },
  { n: 3, label: '재질' },
  { n: 4, label: '인쇄' },
  { n: 5, label: '수량/납기' },
];

export function StepProgress({ step }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, idx) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div
              className={[
                'flex h-9 items-center gap-2 rounded-full border px-3 text-sm',
                active ? 'border-gray-900 bg-gray-900 text-white' : '',
                done ? 'border-gray-900 bg-white text-gray-900' : '',
                !active && !done ? 'border-gray-200 bg-white text-gray-500' : '',
              ].join(' ')}
            >
              <span className="font-medium">{s.n}</span>
              <span>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="mx-2 h-px w-6 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}