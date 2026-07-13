import { setRequestLocale } from 'next-intl/server'

import { FeaturedCategories } from '@/components/home/FeaturedCategories'
import { Hero } from '@/components/home/Hero'
import { PromotionsCarousel } from '@/components/home/PromotionsCarousel'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getCategories,
} from '@/lib/storefront'
import { getPromotedProducts } from '@/lib/promotions'

type Props = {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'
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
      <PromotionsCarousel products={promotedProducts} promotions={promotions} />
      <FeaturedCategories categories={categories} />
    </div>
  )
}
