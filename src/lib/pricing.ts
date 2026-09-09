export function formatPriceDkk(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function applyPromo(price: number, percentOff: number | null): number {
  if (!percentOff) return price
  return Math.round(price * (1 - percentOff / 100) * 100) / 100
}

/**
 * Reference price per kilogram for a prepacked product. Always derived, never
 * stored: the pack price is the source of truth, since the packs are weighed at
 * packing time and the merchant maintains one number, not two.
 *
 * Returns null when the product carries no net weight, i.e. there is nothing to
 * compare against.
 */
export function pricePerKgDkk(
  priceDkk: number,
  netWeightGrams: number | null | undefined,
): number | null {
  if (!netWeightGrams || netWeightGrams <= 0) return null
  return Math.round((priceDkk / (netWeightGrams / 1000)) * 100) / 100
}

/**
 * Reference price per litre, for goods sold by volume. Same idea as
 * pricePerKgDkk — a litre is not a kilogram (a litre of oil weighs ~920 g), so
 * liquids get their own comparison unit rather than being converted.
 */
export function pricePerLitreDkk(
  priceDkk: number,
  netVolumeMl: number | null | undefined,
): number | null {
  if (!netVolumeMl || netVolumeMl <= 0) return null
  return Math.round((priceDkk / (netVolumeMl / 1000)) * 100) / 100
}

/** "200 g" below a kilo, "1,2 kg" at or above it — da-DK, so a decimal comma. */
export function formatNetWeight(netWeightGrams: number | null | undefined): string | null {
  return formatMetric(netWeightGrams, 'g', 'kg')
}

/** "500 ml" below a litre, "1,5 l" at or above it. */
export function formatNetVolume(netVolumeMl: number | null | undefined): string | null {
  return formatMetric(netVolumeMl, 'ml', 'l')
}

/** Shared base/kilo formatting for the two content units. */
function formatMetric(
  amount: number | null | undefined,
  small: string,
  large: string,
): string | null {
  if (!amount || amount <= 0) return null
  if (amount < 1000) return `${amount} ${small}`
  const scaled = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 2 }).format(amount / 1000)
  return `${scaled} ${large}`
}

export function productSlug(sku: string): string {
  return encodeURIComponent(sku)
}

export function decodeProductSlug(slug: string): string {
  return decodeURIComponent(slug)
}
