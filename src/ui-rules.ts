// src/ui-rules.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** className 병합 유틸 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

/** 공통 UI 규칙 */
export const UI = {
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-lg font-semibold",
  sub: "text-sm text-slate-600",
  label: "text-sm font-medium text-slate-900",
  helper: "text-xs text-slate-500",
  danger: "text-xs text-red-600",

  card: "rounded-2xl border border-slate-200 bg-white shadow-sm",
  cardHeader: "border-b border-slate-100 px-5 py-4",
  cardBody: "px-5 py-6",

  input:
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400",

  choiceGroup: "grid gap-3 sm:grid-cols-3",
  choice:
    "h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium transition hover:bg-slate-50",
};

/** 버튼 규칙 */
export function button({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  return cn(
    "h-11 rounded-2xl px-5 text-sm font-semibold transition",
    variant === "primary" &&
      "bg-black text-white hover:bg-slate-800",
    variant === "secondary" &&
      "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
  );
}