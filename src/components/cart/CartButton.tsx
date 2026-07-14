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
      className="relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-cream transition-colors hover:bg-burgundy-dark/50 active:bg-burgundy-dark/70"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span>{t('cart')}</span>
      {itemCount > 0 && (
        <span
          key={itemCount}
          className="bh-badge-pop absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-burgundy-dark"
        >
          {itemCount}
        </span>
      )}
    </Link>
  )
}
