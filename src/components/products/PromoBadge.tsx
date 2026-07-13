'use client'

import { useTranslations } from 'next-intl'

export function PromoBadge({ percent }: { percent: number }) {
  const t = useTranslations('product')

  return (
    <span className="inline-flex rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-burgundy-dark">
      {t('promo', { percent })}
    </span>
  )
}
