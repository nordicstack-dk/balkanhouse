import clsx from 'clsx'
import { useTranslations } from 'next-intl'

import { isPublishedStock, type StockStatus } from '@/lib/contracts'

/* A dot plus a word, rather than a third coloured pill competing with the price
   and the promo tag. 'hidden' has no styling because it never reaches the
   storefront — the queries filter it out. */
const text: Partial<Record<StockStatus, string>> = {
  in: 'text-success',
  low: 'text-warning',
  out: 'text-danger',
}

const dot: Partial<Record<StockStatus, string>> = {
  in: 'bg-success',
  low: 'bg-warning',
  out: 'bg-danger',
}

type StockBadgeProps = {
  status: StockStatus | null | undefined
  /**
   * 'overlay' sits on the product photo, so it needs its own surface to stay
   * legible over whatever the image happens to be. 'inline' is the bare
   * dot-and-word used on the product page.
   */
  variant?: 'inline' | 'overlay'
}

export function StockBadge({ status, variant = 'inline' }: StockBadgeProps) {
  const t = useTranslations('stock')

  // Hidden or missing = unpublished, which the storefront queries already
  // filter out. Render nothing rather than a stray badge if one slips through.
  if (!isPublishedStock(status)) return null

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium',
        text[status],
        variant === 'overlay' &&
          'rounded-full bg-paper/90 px-2.5 py-1 shadow-soft ring-1 ring-line/50 backdrop-blur-sm',
      )}
    >
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', dot[status])} aria-hidden />
      {t(status)}
    </span>
  )
}
