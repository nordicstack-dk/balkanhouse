import type { Media, Product } from '@/payload-types'

type ProductWithImages = Product & {
  images?: (number | Media)[] | null
}

export function getProductImageUrl(product: ProductWithImages): string | null {
  const first = product.images?.[0]
  if (!first || typeof first === 'number') return null
  return first.url ?? null
}
