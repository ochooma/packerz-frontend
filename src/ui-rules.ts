// src/ui-rules.ts
type ClassValue = string | undefined | null | false | 0;

/** 아주 단순한 className 합치기 (의존성 없음) */
export function cn(...v: ClassValue[]) {
  return v.filter(Boolean).join(" ");
}

export const UI = {
  // layout
  page: "mx-auto max-w-3xl px-6 py-12",
  pageTitle: "text-3xl font-semibold tracking-tight text-white",
  pageDesc: "mt-2 text-sm text-white/70",

  // card
  card: "mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]",
  cardHead: "px-7 py-5 border-b border-black/5",
  cardTitle: "text-xl font-semibold text-gray-900",
  cardSub: "mt-1 text-sm text-gray-700",
  cardBody: "px-7 py-6",

  // form
  label: "text-sm font-medium text-gray-900",
  input:
    "h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20",
  select:
    "h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20",
  danger: "text-xs text-red-600",

  // segmented buttons (세금증빙 선택)
  segBase:
    "h-12 rounded-2xl border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-black/20",
  segIdle: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  segOn: "border-gray-900 bg-white text-gray-900 ring-2 ring-gray-900/10",
};

type ButtonVariant = "primary" | "secondary";

export function button(opts?: { variant?: ButtonVariant; disabled?: boolean }) {
  const variant = opts?.variant ?? "primary";
  const disabled = !!opts?.disabled;

  const base =
    "inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60";

  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90"
      : "border border-white/30 bg-transparent text-white hover:bg-white/10";

  return cn(base, styles, disabled && "pointer-events-none");
}