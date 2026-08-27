import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'

import { CategoryNav } from '@/components/shop/CategoryNav'
import { SearchBar } from '@/components/shop/SearchBar'
import { ShopHeading } from '@/components/shop/ShopHeading'
import {
  CategoryNavSkeleton,
  ShopHeadingSkeleton,
  Skeleton,
} from '@/components/ui/Skeleton'
import { assertLocale } from '@/i18n/locale-guard'
import { getActivePromotions, getCategories } from '@/lib/storefront'
import { getPromotedProducts } from '@/lib/promotions'
import type { Category } from '@/payload-types'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

/*
 * Layouts persist across navigations within /shop, so the search bar and
 * category sidebar stay mounted while only the product area (the page) streams
 * through its loading boundary.
 *
 * Crucially this layout must not `await` the category list. `loading.tsx`
 * renders *inside* this layout, so an await here blocks the page's skeleton
 * too — a navigation into /shop showed nothing at all until the query resolved.
 * Instead the promise is handed to the two pieces that need it, each behind its
 * own Suspense boundary, so the shell and the product skeleton paint at once.
 */
export default async function ShopLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params
  const locale = assertLocale(rawLocale)
  setRequestLocale(locale)

  const categoriesPromise = getCategories(locale)
  // The offers row is non-critical furniture, so a promotions failure hides the
  // row rather than taking down the sidebar.
  const hasOffersPromise = getActivePromotions()
    .then((promotions) => getPromotedProducts(promotions).length > 0)
    .catch(() => false)

  return (
    <div>
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-11 w-full rounded-full" />}>
          <SearchBar />
        </Suspense>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <Suspense fallback={<CategoryNavSkeleton />}>
          <CategoryNavSection
            categoriesPromise={categoriesPromise}
            hasOffersPromise={hasOffersPromise}
          />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<ShopHeadingSkeleton />}>
            <ShopHeadingSection categoriesPromise={categoriesPromise} />
          </Suspense>
          {children}
        </div>
      </div>
    </div>
  )
}

/*
 * Both consumers await the same promise rather than calling getCategories
 * twice; the cache would dedupe it anyway, but sharing keeps it to one
 * in-flight request and one suspension per render.
 */
async function CategoryNavSection({
  categoriesPromise,
  hasOffersPromise,
}: {
  categoriesPromise: Promise<Category[]>
  hasOffersPromise: Promise<boolean>
}) {
  const [categories, hasOffers] = await Promise.all([categoriesPromise, hasOffersPromise])
  return <CategoryNav categories={categories} hasOffers={hasOffers} />
}

async function ShopHeadingSection({
  categoriesPromise,
}: {
  categoriesPromise: Promise<Category[]>
}) {
  const categories = await categoriesPromise
  return <ShopHeading categories={categories} />
}
