import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number): string {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericValue);
} 

export function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const numericValue = typeof value === "string" ? parseFloat(value.trim().replace(',', '.')) : value;
  return Number(numericValue.toFixed(2));
}