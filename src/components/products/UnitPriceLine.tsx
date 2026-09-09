import { useTranslations } from 'next-intl'

import { UNIT } from '@/lib/contracts'
import {
  formatNetVolume,
  formatNetWeight,
  formatPriceDkk,
  pricePerKgDkk,
  pricePerLitreDkk,
} from '@/lib/pricing'
import type { Product } from '@/payload-types'

type ContentProduct = Pick<Product, 'unit' | 'netWeightGrams' | 'netVolumeMl'>

/**
 * Which comparison unit this product gets, if any. Weight wins when both are
 * set — that combination is rejected on save, so it only turns up in data
 * written before the validation existed.
 */
function resolveContent(product: ContentProduct): 'weight' | 'volume' | null {
  // A kg-priced product's headline price already *is* the per-kg price, so a
  // second identical figure is noise.
  if (product.unit === UNIT.KG) return null
  if ((product.netWeightGrams ?? 0) > 0) return 'weight'
  if ((product.netVolumeMl ?? 0) > 0) return 'volume'
  return null
}

/**
 * Whether the reference line renders. Exported so callers can drop their
 * "/ unit" price suffix under exactly the same condition — the reference line
 * states the unit better, and stating the rule twice invites drift.
 */
export function hasUnitPriceLine(product: ContentProduct): boolean {
  return resolveContent(product) !== null
}

type Props = {
  product: ContentProduct
  /** The price actually charged (post-promo), so the reference matches the till. */
  priceDkk: number
  className?: string
}

/**
 * "200 g · 59,75 kr./kg" or "1,5 l · 9,98 kr./l" — the pack size plus a derived
 * comparison price, the way a supermarket shelf label carries one. Solids
 * compare per kilogram and liquids per litre, per EU price marking; the two are
 * not interchangeable, since a litre of oil weighs about 920 g.
 *
 * The price above this line is what the customer pays; this only lets them
 * compare pack sizes.
 */
export function UnitPriceLine({ product, priceDkk, className }: Props) {
  const t = useTranslations('product')
  const tUnit = useTranslations('unit')

  const kind = resolveContent(product)
  if (!kind) return null

  const size = kind === 'weight' ? formatNetWeight(product.netWeightGrams) : formatNetVolume(product.netVolumeMl)
  const perUnit =
    kind === 'weight'
      ? pricePerKgDkk(priceDkk, product.netWeightGrams)
      : pricePerLitreDkk(priceDkk, product.netVolumeMl)
  if (!size || perUnit == null) return null

  const unitLabel = kind === 'weight' ? tUnit(UNIT.KG) : tUnit('litre')
  const sizeLabel = kind === 'weight' ? t('netWeight') : t('netVolume')
  const priceLabel = kind === 'weight' ? t('pricePerKgLabel') : t('pricePerLitreLabel')

  return (
    <span
      className={className ?? 'bh-nums block text-xs leading-tight text-text-muted'}
      title={`${sizeLabel}: ${size} — ${priceLabel}`}
    >
      {size}
      <span aria-hidden> · </span>
      {formatPriceDkk(perUnit)}/{unitLabel}
    </span>
  )
}
