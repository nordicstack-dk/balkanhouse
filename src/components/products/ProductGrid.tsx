import type { CSSProperties } from 'react'

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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {products.map((product, i) => (
        /* Wrapper carries the entry animation and its stagger index so the card
           itself stays a pure presentation component. */
        <div
          key={product.id}
          className="bh-rise h-full"
          style={{ '--bh-i': i % 8 } as CSSProperties}
        >
          <ProductCard
            product={product}
            promoPercent={getPromoPercentForProduct(product.id, promotions)}
          />
        </div>
      ))}
    </div>
  )
}
