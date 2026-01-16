import type { PackageConfig } from '@/types/package';

function qtyBucket(qty?: number) {
  if (!qty) return undefined;
  if (qty < 500) return '300';
  if (qty < 1000) return '500';
  if (qty < 2000) return '1000';
  if (qty < 5000) return '3000';
  return '5000';
}

export function buildPackageSku(config: PackageConfig) {
  const type = config.type;
  const material = config.material;
  const print = config.print ?? 'NP';
  const lead = config.lead ?? 'STD';
  const qty = qtyBucket(config.quantity);

  if (!type || !material || !qty) return null;
  return `PKG-${type}-${material}-${print}-${qty}-${lead}`;
}