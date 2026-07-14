import { setRequestLocale } from 'next-intl/server'

import { FeaturedCategories } from '@/components/home/FeaturedCategories'
import { Hero } from '@/components/home/Hero'
import { PromotionsCarousel } from '@/components/home/PromotionsCarousel'
import { ProductCard } from '@/components/products/ProductCard'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getCategories,
} from '@/lib/storefront'
import { getPromoPercentForProduct, getPromotedProducts } from '@/lib/promotions'

type Props = {
  params: Promise<{ locale: string }>
}

// ISR: static shell regenerated at most every 60s; data comes from the tagged
// storefront cache which is invalidated on CMS changes.
export const revalidate = 60

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [categories, promotions] = await Promise.all([
    getCategories(locale as Locale),
    getActivePromotions(),
  ])
  const promotedProducts = getPromotedProducts(promotions)

  return (
    <div>
      <Hero />
      {promotedProducts.length > 0 && (
        <PromotionsCarousel>
          {promotedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              promoPercent={getPromoPercentForProduct(product.id, promotions)}
            />
          ))}
        </PromotionsCarousel>
      )}
      <FeaturedCategories categories={categories} />
    </div>
  )
}
