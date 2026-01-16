import type { PackageConfig, Estimate } from '@/types/package';

const BASE: Record<string, Record<string, number>> = {
  FC: { SC350: 420, IV300: 390, EG: 0 },
  SL: { SC350: 360, IV300: 340, EG: 0 },
  RSC: { EG: 520, SC350: 0, IV300: 0 },
};

const PRINT: Record<string, number> = { NP: 1.0, '4C': 1.25, '4C2': 1.45 };
const LEAD: Record<string, number> = { STD: 1.0, EXP: 1.2 };

function qtyFactor(qty?: number) {
  if (!qty) return 0;
  if (qty < 500) return 1.25;      // 300~499 가정
  if (qty < 1000) return 1.10;     // 500~999
  if (qty < 2000) return 1.00;     // 1000~1999
  if (qty < 5000) return 0.85;     // 3000~4999
  return 0.80;
}

function sizeFactor(size?: { w?: number; d?: number }) {
  const w = size?.w ?? 0;
  const d = size?.d ?? 0;
  if (!w || !d) return 1.0;
  const area = w * d;
  const base = 100 * 100;
  if (area <= base) return 1.0;
  if (area <= base * 1.5) return 1.1;
  if (area <= base * 2.0) return 1.25;
  return 1.35;
}

export function estimatePackagePrice(config: PackageConfig): Estimate | null {
  const type = config.type;
  const material = config.material;
  const print = config.print ?? 'NP';
  const lead = config.lead ?? 'STD';
  const qty = config.quantity;

  if (!type || !material || !qty) return null;

  const base = BASE[type]?.[material] ?? 0;
  if (!base) return null;

  const unit =
    base *
    qtyFactor(qty) *
    (PRINT[print] ?? 1.0) *
    (LEAD[lead] ?? 1.0) *
    sizeFactor(config.size);

  const total = unit * qty;

  return {
    currency: 'KRW',
    min: Math.floor(total * 0.9),
    max: Math.ceil(total * 1.1),
    unit: Math.round(unit),
  };
}

export function formatKRW(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n);
}