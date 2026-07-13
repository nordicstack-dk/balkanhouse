export function formatPriceDkk(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function applyPromo(price: number, percentOff: number | null): number {
  if (!percentOff) return price
  return Math.round(price * (1 - percentOff / 100) * 100) / 100
}

export function productSlug(sku: string): string {
  return encodeURIComponent(sku)
}

export function decodeProductSlug(slug: string): string {
  return decodeURIComponent(slug)
}
