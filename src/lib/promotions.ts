import type { Product, Promotion } from '@/payload-types'

export function getPromoPercentForProduct(
  productId: number,
  promotions: Promotion[],
): number | null {
  for (const promo of promotions) {
    const products = promo.products
    if (!products?.length) continue

    const ids = products.map((p) => (typeof p === 'number' ? p : p.id))
    if (ids.includes(productId)) {
      return promo.percentOff
    }
  }
  return null
}

export function getPromotedProducts(promotions: Promotion[]): Product[] {
  const seen = new Set<number>()
  const products: Product[] = []

  for (const promo of promotions) {
    for (const item of promo.products ?? []) {
      if (typeof item === 'number') continue
      if (seen.has(item.id)) continue
      seen.add(item.id)
      products.push(item)
    }
  }

  return products
}
