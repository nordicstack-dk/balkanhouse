'use client'

import { useTranslations } from 'next-intl'

import type { Product } from '@/payload-types'
import type { Promotion } from '@/payload-types'

import { ProductCard } from '@/components/products/ProductCard'
import { getPromoPercentForProduct } from '@/lib/promotions'

type PromotionsCarouselProps = {
  products: Product[]
  promotions: Promotion[]
}

export function PromotionsCarousel({ products, promotions }: PromotionsCarouselProps) {
  const t = useTranslations('home')

  if (!products.length) return null

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold text-text">{t('promotionsTitle')}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map((product) => (
          <div key={product.id} className="w-56 shrink-0 md:w-64">
            <ProductCard
              product={product}
              promoPercent={getPromoPercentForProduct(product.id, promotions)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
