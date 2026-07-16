import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ProductGrid } from '@/components/products/ProductGrid'
import { Pagination } from '@/components/shop/Pagination'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getProductsPage,
} from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

// This page reads searchParams (?q=, ?page=) so it renders per request;
// the tagged storefront cache underneath keeps it fast. Search bar and
// category nav live in the persistent shop layout.

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q, page: pageParam } = await searchParams
  setRequestLocale(locale as Locale)

  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [t, productsPage, promotions] = await Promise.all([
    getTranslations('shop'),
    getProductsPage({ locale: locale as Locale, search: q, page: requestedPage }),
    getActivePromotions(),
  ])
  const { docs: products, page, totalPages } = productsPage

  return (
    <div>
      {q && (
        <p className="mb-4 text-sm text-text-muted">{t('resultsFor', { query: q })}</p>
      )}
      {products.length ? (
        <>
          <ProductGrid products={products} promotions={promotions} />
          <Pagination page={page} totalPages={totalPages} query={q} />
        </>
      ) : (
        <p className="text-text-muted">{t('noProducts')}</p>
      )}
    </div>
  )
}
