import type { Estimate, PackageConfig } from '@/types/package';
import { formatKRW } from '@/lib/pricing/packagePricing';

const LABELS = {
  type: { FC: '단상자', SL: '슬리브', RSC: '배송박스' },
  material: { SC350: 'SC마닐라 350g', IV300: '아이보리 300g', EG: 'E골 골판지' },
  print: { NP: '인쇄 없음', '4C': '단면 4도', '4C2': '양면 4도' },
  lead: { STD: '일반', EXP: '급행' },
} as const;

type Props = {
  config: PackageConfig;
  sku: string | null;
  estimate: Estimate | null;
};

export function SummaryPanel({ config, sku, estimate }: Props) {
  const size = config.size;
  const sizeText =
    size?.w && size?.d && size?.h
      ? `${size.w}×${size.d}×${size.h}mm (${size.basis === 'internal' ? '내경' : '외경'})`
      : '—';

  return (
    <div className="sticky top-6 h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold">주문 요약</div>

      <dl className="mt-4 space-y-3 text-sm">
        <Row label="제품" value={config.type ? LABELS.type[config.type] : '—'} />
        <Row label="사이즈" value={sizeText} />
        <Row
          label="재질"
          value={config.material ? LABELS.material[config.material] : '—'}
        />
        <Row label="인쇄" value={config.print ? LABELS.print[config.print] : '—'} />
        <Row label="수량" value={config.quantity ? `${config.quantity.toLocaleString()}개` : '—'} />
        <Row label="납기" value={config.lead ? LABELS.lead[config.lead] : '—'} />
      </dl>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="text-xs text-gray-600">예상 제작 비용</div>
        <div className="mt-1 text-lg font-semibold">
          {estimate ? `₩ ${formatKRW(estimate.min)} ~ ${formatKRW(estimate.max)}` : '—'}
        </div>
        <div className="mt-2 text-xs leading-relaxed text-gray-600">
          ※ 도면/사양 검수 후 확정 견적을 안내드립니다.
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        SKU: <span className="font-mono">{sku ?? '—'}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right text-gray-900">{value}</dd>
    </div>
  );
}