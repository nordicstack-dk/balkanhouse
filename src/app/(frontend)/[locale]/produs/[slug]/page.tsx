import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/products/AddToCartButton'
import { AllergenList } from '@/components/products/AllergenList'
import { PromoBadge } from '@/components/products/PromoBadge'
import { StockBadge } from '@/components/products/StockBadge'
import { RichText } from '@/components/ui/RichText'
import type { Locale } from '@/i18n/routing'
import type { AllergenEU } from '@/lib/contracts'
import { applyPromo, decodeProductSlug, formatPriceDkk } from '@/lib/pricing'
import {
  getActivePromotions,
  getProductBySku,
} from '@/lib/storefront'
import { getPromoPercentForProduct } from '@/lib/promotions'
import { getProductImageUrl } from '@/lib/product-utils'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

// ISR: no product pages at build time; each is rendered on first visit,
// cached, and regenerated at most every 60s using the tagged storefront cache.
export function generateStaticParams() {
  return []
}
export const revalidate = 60

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale as Locale)

  const sku = decodeProductSlug(slug)
  const [product, promotions, t, tUnit] = await Promise.all([
    getProductBySku(sku, locale as Locale),
    getActivePromotions(),
    getTranslations('product'),
    getTranslations('unit'),
  ])
  if (!product) notFound()

  const promoPercent = getPromoPercentForProduct(product.id, promotions)
  const finalPrice = applyPromo(product.priceDkk, promoPercent)
  const imageUrl = getProductImageUrl(product)

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-cream-dark bg-cream-dark/30">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 576px"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl text-wood-light">
            🏠
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text">{product.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StockBadge status={product.stockStatus} />
            {promoPercent != null && promoPercent > 0 && (
              <PromoBadge percent={promoPercent} />
            )}
          </div>
        </div>

        <div>
          {promoPercent != null && promoPercent > 0 && (
            <span className="mr-2 text-lg text-text-muted line-through">
              {formatPriceDkk(product.priceDkk)}
            </span>
          )}
          <span className="text-2xl font-bold text-burgundy">
            {formatPriceDkk(finalPrice)}
          </span>
          <span className="ml-2 text-sm text-text-muted">/ {tUnit(product.unit)}</span>
        </div>

        <AddToCartButton product={product} promoPercent={promoPercent} />

        {product.countryOfOrigin && (
          <p className="text-sm text-text-muted">
            <span className="font-medium">{t('origin')}:</span> {product.countryOfOrigin}
          </p>
        )}

        {product.ingredients && (
          <section>
            <h2 className="mb-2 font-semibold text-text">{t('ingredients')}</h2>
            <p className="text-text-muted">{product.ingredients}</p>
          </section>
        )}

        {product.allergens && product.allergens.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-text">{t('allergens')}</h2>
            <AllergenList allergens={product.allergens as AllergenEU[]} />
          </section>
        )}

        {product.description && (
          <section>
            <h2 className="mb-2 font-semibold text-text">{t('description')}</h2>
            <RichText content={product.description} />
          </section>
        )}
      </div>
    </div>
  )
}
