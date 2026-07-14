import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryNav } from '@/components/shop/CategoryNav'
import { Pagination } from '@/components/shop/Pagination'
import { SearchBar } from '@/components/shop/SearchBar'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getCategories,
  getProductsPage,
} from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

// This page reads searchParams (?q=, ?page=) so it renders per request;
// the tagged storefront cache underneath keeps it fast.

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q, page: pageParam } = await searchParams
  setRequestLocale(locale as Locale)

  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [t, categories, productsPage, promotions] = await Promise.all([
    getTranslations('shop'),
    getCategories(locale as Locale),
    getProductsPage({ locale: locale as Locale, search: q, page: requestedPage }),
    getActivePromotions(),
  ])
  const { docs: products, page, totalPages } = productsPage

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-text">{t('title')}</h1>
      <div className="mb-6">
        <SearchBar defaultValue={q} />
      </div>
      {q && (
        <p className="mb-4 text-sm text-text-muted">{t('resultsFor', { query: q })}</p>
      )}
      <div className="flex flex-col gap-8 md:flex-row">
        <CategoryNav categories={categories} />
        <div className="min-w-0 flex-1">
          {products.length ? (
            <>
              <ProductGrid products={products} promotions={promotions} />
              <Pagination page={page} totalPages={totalPages} query={q} />
            </>
          ) : (
            <p className="text-text-muted">{t('noProducts')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
