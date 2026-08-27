import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk, productSlug } from '@/lib/pricing'
import type { Product } from '@/payload-types'
import { getProductImageAlt, getProductImageUrl } from '@/lib/product-utils'
import { WovenMark } from '@/components/ui/WovenMark'
import { LinkPendingEdge } from '@/components/ui/LinkPending'

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
    <article className="group rounded-core relative flex h-full flex-col overflow-hidden bg-paper shadow-soft ring-1 ring-line/60 transition-all duration-500 ease-glide hover:-translate-y-1 hover:shadow-lift hover:ring-gold/40">
      <Link href={`/produs/${productSlug(product.sku)}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-paper-sunk">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={getProductImageAlt(product)}
              fill
              className="object-cover transition-transform duration-700 ease-glide group-hover:scale-[1.06]"
              sizes="(max-width: 768px) 50vw, 288px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-wood-light" aria-hidden>
              <WovenMark size={48} />
            </div>
          )}
          {hasPromo && (
            <div className="absolute left-0 top-3">
              <PromoBadge percent={promoPercent} />
            </div>
          )}
          {/* Separates pale product photos from the card surface. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-text/8 to-transparent"
            aria-hidden
          />
        </div>
        <LinkPendingEdge />
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3.5">
        <Link
          href={`/produs/${productSlug(product.sku)}`}
          className="line-clamp-2 font-semibold leading-snug text-text transition-colors duration-300 hover:text-burgundy"
        >
          {product.title}
        </Link>
        {/* The struck price always takes its own line. Inline, it wrapped only on
            the cards whose numbers happened to be wide, so price rows stopped
            lining up across a grid row. */}
        <div className="mt-auto pt-1">
          {hasPromo && (
            <span className="bh-nums block text-sm leading-tight text-text-muted/80 line-through decoration-danger/50">
              {formatPriceDkk(product.priceDkk)}
            </span>
          )}
          <div className="flex items-end justify-between gap-2">
            <span className="bh-nums whitespace-nowrap text-[1.0625rem] font-bold tracking-tight text-burgundy">
              {formatPriceDkk(finalPrice)}
              <span className="ml-1 text-xs font-normal tracking-normal text-text-muted">
                / {t(product.unit)}
              </span>
            </span>
            <StockBadge status={product.stockStatus} />
          </div>
        </div>
      </div>
    </article>
  )
}
