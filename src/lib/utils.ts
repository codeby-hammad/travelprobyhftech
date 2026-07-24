import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'PKR'
): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = Number(amount)
  if (isNaN(num)) return '—'
  return `${currency} ${num.toLocaleString('en-PK')}`
}

export function formatDate(
  date: string | Date | null | undefined
): string {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('en-PK', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    })
  } catch {
    return String(date)
  }
}