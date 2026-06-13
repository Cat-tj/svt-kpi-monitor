import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency in Indonesian Rupiah */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format percentage with one decimal */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format large numbers with compact notation */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Calculate KPI achievement percentage */
export function calculateAchievement(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((actual / target) * 100, 150); // Cap at 150%
}

/** Get status color based on achievement */
export function getStatusColor(achievement: number): string {
  if (achievement >= 100) return "text-emerald-600";
  if (achievement >= 75) return "text-amber-500";
  return "text-red-500";
}

/** Get status background based on achievement */
export function getStatusBg(achievement: number): string {
  if (achievement >= 100) return "bg-emerald-50 border-emerald-200";
  if (achievement >= 75) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}
