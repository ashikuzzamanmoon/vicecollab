import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class lists, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact number: 12500 -> "12.5K", 2300000 -> "2.3M". */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** Human countdown to a deadline: "2d 5h left", "45m left", or "Expired". */
export function timeLeft(target: Date | string): { expired: boolean; label: string } {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { expired: true, label: "Expired" };
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return { expired: false, label: `${minutes}m left` };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { expired: false, label: `${hours}h ${minutes % 60}m left` };
  const days = Math.floor(hours / 24);
  return { expired: false, label: `${days}d ${hours % 24}h left` };
}

/** Short date: "Nov 20, 2026". */
export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
