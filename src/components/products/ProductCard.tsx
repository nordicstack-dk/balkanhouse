import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk, productSlug } from '@/lib/pricing'
import type { Product } from '@/payload-types'
import { getProductImageAlt, getProductImageUrl } from '@/lib/product-utils'

import { PromoBadge } from './PromoBadge'
import { StockBadge } from './StockBadge'

type ProductCardProps = {
  product: Product
  promoPercent?: number | null
}

export function ProductCard({ product, promoPercent }: ProductCardProps) {
  const t = useTranslations('unit')
  const imageUrl = getProductImageUrl(product)
  const finalPrice = applyPromo(product.priceDkk, promoPercent ?? null)
  const hasPromo = promoPercent != null && promoPercent > 0

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-cream-dark bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-wood-light hover:shadow-lg">
      <Link href={`/produs/${productSlug(product.sku)}`} className="block">
        <div className="relative aspect-square bg-cream-dark/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={getProductImageAlt(product)}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 288px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-wood-light">
              🏠
            </div>
          )}
          {hasPromo && (
            <div className="absolute left-2 top-2">
              <PromoBadge percent={promoPercent} />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/produs/${productSlug(product.sku)}`}
          className="line-clamp-2 font-semibold text-text transition-colors hover:text-burgundy"
        >
          {product.title}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            {hasPromo && (
              <span className="whitespace-nowrap text-sm text-text-muted line-through">
                {formatPriceDkk(product.priceDkk)}
              </span>
            )}
            <span className="whitespace-nowrap font-bold text-burgundy">
              {formatPriceDkk(finalPrice)}
              <span className="ml-1 text-xs font-normal text-text-muted">/ {t(product.unit)}</span>
            </span>
          </div>
          <StockBadge status={product.stockStatus} />
        </div>
      </div>
    </article>
  )
}
