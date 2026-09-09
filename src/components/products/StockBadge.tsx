import clsx from 'clsx'
import { useTranslations } from 'next-intl'

import type { StockStatus } from '@/lib/contracts'

/* A dot plus a word, rather than a third coloured pill competing with the price
   and the promo tag. */
const text: Record<StockStatus, string> = {
  in: 'text-success',
  low: 'text-warning',
  out: 'text-danger',
}

const dot: Record<StockStatus, string> = {
  in: 'bg-success',
  low: 'bg-warning',
  out: 'bg-danger',
}

export function StockBadge({ status }: { status: StockStatus | null | undefined }) {
  const t = useTranslations('stock')

  // No status = unpublished, which the storefront queries already filter out.
  // Render nothing rather than an untranslated badge if one ever slips through.
  if (!status) return null

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium',
        text[status],
      )}
    >
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', dot[status])} aria-hidden />
      {t(status)}
    </span>
  )
}
