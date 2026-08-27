import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ProductGrid } from '@/components/products/ProductGrid'
import { assertLocale } from '@/i18n/locale-guard'
import { getActivePromotions } from '@/lib/storefront'
import { getPromotedProducts } from '@/lib/promotions'

type Props = {
  params: Promise<{ locale: string }>
}

// Static segment, so it takes precedence over /shop/[categorySlug]. Renders
// inside the shop layout like any category, reusing its search bar and sidebar.
export const revalidate = 60

export default async function OffersPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = assertLocale(rawLocale)
  setRequestLocale(locale)

  const [t, promotions] = await Promise.all([getTranslations('shop'), getActivePromotions()])

  // Already deduped across overlapping promotions, and populated to depth 2 by
  // getActivePromotions, so the cards have their images.
  const products = getPromotedProducts(promotions)

  if (!products.length) {
    return <p className="text-text-muted">{t('noProducts')}</p>
  }

  // No pagination: the set is bounded by what the promotions actually link,
  // which is a curated list rather than the whole catalogue.
  return <ProductGrid products={products} promotions={promotions} />
}
