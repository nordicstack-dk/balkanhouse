import type { Product } from '@/payload-types'
import { getPromoPercentForProduct } from '@/lib/promotions'
import type { Promotion } from '@/payload-types'

import { ProductCard } from './ProductCard'

type ProductGridProps = {
  products: Product[]
  promotions?: Promotion[]
}

export function ProductGrid({ products, promotions = [] }: ProductGridProps) {
  if (!products.length) return null

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          promoPercent={getPromoPercentForProduct(product.id, promotions)}
        />
      ))}
    </div>
  )
}
