'use client';

import { useMemo, useState } from 'react';
import type { PackageConfig } from '@/types/package';
import { StepProgress } from './_components/StepProgress';
import { SummaryPanel } from './_components/SummaryPanel';
import { ConfigSteps } from './_components/ConfigSteps';
import { buildPackageSku } from '@/lib/sku/packageSku';
import { estimatePackagePrice } from '@/lib/pricing/packagePricing';

export default function PackageConfigurePage() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<PackageConfig>({
    lead: 'STD',
    print: 'NP',
    size: { basis: 'internal' },
  });

  const sku = useMemo(() => buildPackageSku(config), [config]);
  const estimate = useMemo(() => estimatePackagePrice(config), [config]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold">패키지 주문</h1>
      <p className="mt-1 text-sm text-gray-600">
        옵션을 선택하고 파일 업로드 단계로 진행하세요. (확정 견적은 검수 후 안내)
      </p>

      <div className="mt-6">
        <StepProgress step={step} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConfigSteps
            step={step}
            setStep={setStep}
            config={config}
            setConfig={setConfig}
          />
        </div>

        <SummaryPanel config={config} sku={sku} estimate={estimate} />
      </div>
    </div>
  );
}