import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { ProductGrid } from '@/components/products/ProductGrid'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getCategoryBySlug,
  getProducts,
} from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string; categorySlug: string }>
  searchParams: Promise<{ q?: string }>
}

// This page reads searchParams (?q=) so it renders per request;
// the tagged storefront cache underneath keeps it fast. Search bar and
// category nav live in the persistent shop layout.

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { locale, categorySlug } = await params
  const { q } = await searchParams
  setRequestLocale(locale as Locale)

  const [category, promotions, t] = await Promise.all([
    getCategoryBySlug(categorySlug, locale as Locale),
    getActivePromotions(),
    getTranslations('shop'),
  ])
  if (!category) notFound()

  const products = await getProducts({
    locale: locale as Locale,
    categoryId: category.id,
    search: q,
  })

  return (
    <div>
      {q && (
        <p className="mb-4 text-sm text-text-muted">{t('resultsFor', { query: q })}</p>
      )}
      {products.length ? (
        <ProductGrid products={products} promotions={promotions} />
      ) : (
        <p className="text-text-muted">{t('noProducts')}</p>
      )}
    </div>
  )
}
