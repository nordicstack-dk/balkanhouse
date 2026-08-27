import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/products/AddToCartButton'
import { AllergenList } from '@/components/products/AllergenList'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCarousel } from '@/components/products/ProductCarousel'
import { PromoBadge } from '@/components/products/PromoBadge'
import { StockBadge } from '@/components/products/StockBadge'
import { RichText } from '@/components/ui/RichText'
import { WovenMark } from '@/components/ui/WovenMark'
import { assertLocale } from '@/i18n/locale-guard'
import type { AllergenEU } from '@/lib/contracts'
import { applyPromo, decodeProductSlug, formatPriceDkk } from '@/lib/pricing'
import {
  getActivePromotions,
  getProductBySku,
  getRelatedProductsByKeyword,
} from '@/lib/storefront'
import { getPromoPercentForProduct } from '@/lib/promotions'
import { getProductImageAlt, getProductImageUrl } from '@/lib/product-utils'

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
  const { locale: rawLocale, slug } = await params
  const locale = assertLocale(rawLocale)
  setRequestLocale(locale)

  const sku = decodeProductSlug(slug)
  const [product, promotions, t, tUnit] = await Promise.all([
    getProductBySku(sku, locale),
    getActivePromotions(),
    getTranslations('product'),
    getTranslations('unit'),
  ])
  if (!product) notFound()

  const relatedProducts = await getRelatedProductsByKeyword(
    product.keyword,
    product.id,
    locale,
  )

  const promoPercent = getPromoPercentForProduct(product.id, promotions)
  const finalPrice = applyPromo(product.priceDkk, promoPercent)
  const imageUrl = getProductImageUrl(product)

  return (
    <div className="space-y-16">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* Double bezel: the photo sits in a wood-toned tray, framed like goods
            on a market counter rather than floating on the page. */}
        <div className="rounded-shell bg-gradient-to-b from-wood-light/40 to-wood/20 p-1.5 shadow-lift">
          <div className="rounded-core relative aspect-square overflow-hidden bg-paper-sunk">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={getProductImageAlt(product)}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 576px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-wood-light" aria-hidden>
                <WovenMark size={96} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-text md:text-5xl">{product.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StockBadge status={product.stockStatus} />
              {promoPercent != null && promoPercent > 0 && (
                <PromoBadge percent={promoPercent} />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2.5">
            {promoPercent != null && promoPercent > 0 && (
              <span className="bh-nums text-lg text-text-muted/80 line-through decoration-danger/50">
                {formatPriceDkk(product.priceDkk)}
              </span>
            )}
            <span className="bh-nums text-3xl font-bold tracking-tight text-burgundy md:text-4xl">
              {formatPriceDkk(finalPrice)}
            </span>
            <span className="text-sm text-text-muted">/ {tUnit(product.unit)}</span>
          </div>

          <AddToCartButton product={product} promoPercent={promoPercent} />

          {product.countryOfOrigin && (
            <p className="text-sm text-text-muted">
              <span className="font-medium">{t('origin')}:</span> {product.countryOfOrigin}
            </p>
          )}

          {product.ingredients && (
            <section>
              <h2 className="mb-2.5 font-sans text-base font-semibold tracking-normal text-text">{t('ingredients')}</h2>
              <p className="text-text-muted">{product.ingredients}</p>
            </section>
          )}

          {product.allergens && product.allergens.length > 0 && (
            <section>
              <h2 className="mb-2.5 font-sans text-base font-semibold tracking-normal text-text">{t('allergens')}</h2>
              <AllergenList allergens={product.allergens as AllergenEU[]} />
            </section>
          )}

          {product.description && (
            <section>
              <h2 className="mb-2.5 font-sans text-base font-semibold tracking-normal text-text">{t('description')}</h2>
              <RichText content={product.description} />
            </section>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <ProductCarousel title={t('relatedProducts')}>
          {relatedProducts.map((relatedProduct) => (
            <ProductCard
              key={relatedProduct.id}
              product={relatedProduct}
              promoPercent={getPromoPercentForProduct(relatedProduct.id, promotions)}
            />
          ))}
        </ProductCarousel>
      )}
    </div>
  )
}
