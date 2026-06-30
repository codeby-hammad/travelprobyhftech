// Small helper functions used everywhere in the app

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// This combines Tailwind CSS classes safely (shadcn/ui needs this)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a number as currency: 5000 → "PKR 5,000"
export function formatCurrency(amount: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format a date nicely: "2024-01-15" → "Jan 15, 2024"
export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Make a URL-safe slug from a name: "Sunrise Travels" → "sunrise-travels"
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}