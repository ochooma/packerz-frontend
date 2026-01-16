import type { PackageConfig } from '@/types/package';

const KEY = 'pkg_draft_v1';

export function saveDraft(config: PackageConfig) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(config));
}

export function loadDraft(): PackageConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PackageConfig;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}