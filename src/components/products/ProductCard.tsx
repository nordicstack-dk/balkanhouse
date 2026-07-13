'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk, productSlug } from '@/lib/pricing'
import type { Product } from '@/payload-types'
import { getProductImageUrl } from '@/lib/product-utils'

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
    <article className="group flex flex-col overflow-hidden rounded-lg border border-cream-dark bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/produs/${productSlug(product.sku)}`} className="block">
        <div className="relative aspect-square bg-cream-dark/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
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
          className="font-semibold text-text hover:text-burgundy"
        >
          {product.title}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div>
            {hasPromo && (
              <span className="mr-2 text-sm text-text-muted line-through">
                {formatPriceDkk(product.priceDkk)}
              </span>
            )}
            <span className="font-bold text-burgundy">{formatPriceDkk(finalPrice)}</span>
            <span className="ml-1 text-xs text-text-muted">/ {t(product.unit)}</span>
          </div>
          <StockBadge status={product.stockStatus} />
        </div>
      </div>
    </article>
  )
}
