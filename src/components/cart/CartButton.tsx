'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

import { useCart } from './CartProvider'

export function CartButton() {
  const t = useTranslations('nav')
  const { itemCount } = useCart()

  return (
    <Link
      href="/cos"
      className="relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-cream transition hover:bg-burgundy-dark/50"
    >
      <span aria-hidden>🛒</span>
      <span>{t('cart')}</span>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-burgundy-dark">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
