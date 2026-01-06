import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined) {
  const num = typeof value === 'string' ? Number(value) : value ?? 0
  const safe = Number.isFinite(num) ? num : 0
  return currencyFormatter.format(safe)
}

export function slugify(input: string) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
