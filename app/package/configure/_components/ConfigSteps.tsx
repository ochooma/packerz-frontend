import type { PackageConfig } from '@/types/package';
import { StepProduct } from './StepProduct';
import { StepSize } from './StepSize';
import { StepMaterial } from './StepMaterial';
import { StepPrint } from './StepPrint';
import { StepQuantityLead } from './StepQuantityLead';
import { NextBackBar } from './NextBackBar';
import { useRouter } from 'next/navigation';

type Props = {
  step: number;
  setStep: (n: number) => void;
  config: PackageConfig;
  setConfig: React.Dispatch<React.SetStateAction<PackageConfig>>;
};

function isStepComplete(step: number, c: PackageConfig) {
  if (step === 1) return !!c.type;
  if (step === 2) return !!c.size?.w && !!c.size?.d && !!c.size?.h && !!c.size?.basis;
  if (step === 3) return !!c.material;
  if (step === 4) return !!c.print;
  if (step === 5) return !!c.quantity && c.quantity > 0 && !!c.lead;
  return false;
}

function maxAllowedStep(c: PackageConfig) {
  let max = 1;
  if (isStepComplete(1, c)) max = 2;
  if (isStepComplete(2, c)) max = 3;
  if (isStepComplete(3, c)) max = 4;
  if (isStepComplete(4, c)) max = 5;
  return max;
}

export function ConfigSteps({ step, setStep, config, setConfig }: Props) {
  const router = useRouter();
  const maxStep = maxAllowedStep(config);
  const canGoNext = isStepComplete(step, config);

  const goPrev = () => setStep(Math.max(1, step - 1));
  const goNext = async () => {
  if (!canGoNext) return;
  if (step < 5) setStep(step + 1);
  else {
    const { saveDraft } = await import('@/lib/draft/packageDraft');
    saveDraft(config);
    router.push('/package/upload');
  }
};

  const jumpTo = (target: number) => {
    // 뒤로는 자유롭게, 앞으로는 maxStep까지만
    if (target <= maxStep) setStep(target);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const enabled = n <= maxStep;
          const active = n === step;
          return (
            <button
              key={n}
              type="button"
              onClick={() => enabled && jumpTo(n)}
              className={[
                'rounded-full px-3 py-1 text-sm',
                active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700',
                enabled ? 'opacity-100' : 'opacity-40 cursor-not-allowed',
              ].join(' ')}
              aria-disabled={!enabled}
            >
              STEP {n}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {step === 1 && (
          <StepProduct
            value={config.type}
            onChange={(type) => setConfig((p) => ({ ...p, type }))}
          />
        )}

        {step === 2 && (
          <StepSize
            value={config.size}
            onChange={(size) => setConfig((p) => ({ ...p, size: { ...p.size, ...size } }))}
          />
        )}

        {step === 3 && (
          <StepMaterial
            packageType={config.type}
            value={config.material}
            onChange={(material) => setConfig((p) => ({ ...p, material }))}
          />
        )}

        {step === 4 && (
          <StepPrint
            value={config.print}
            onChange={(print) => setConfig((p) => ({ ...p, print }))}
          />
        )}

        {step === 5 && (
          <StepQuantityLead
            value={{ quantity: config.quantity, lead: config.lead }}
            onChange={(patch) => setConfig((p) => ({ ...p, ...patch }))}
          />
        )}
      </div>

      <NextBackBar
        step={step}
        canGoNext={canGoNext}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}