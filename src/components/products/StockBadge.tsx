'use client'

import clsx from 'clsx'
import { useTranslations } from 'next-intl'

import type { StockStatus } from '@/lib/contracts'

const styles: Record<StockStatus, string> = {
  in: 'bg-success/15 text-success',
  low: 'bg-warning/15 text-warning',
  out: 'bg-danger/15 text-danger',
}

export function StockBadge({ status }: { status: StockStatus }) {
  const t = useTranslations('stock')

  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {t(status)}
    </span>
  )
}
