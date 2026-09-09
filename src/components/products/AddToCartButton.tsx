'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { STOCK_STATUS } from '@/lib/contracts'
import { getProductImageUrl } from '@/lib/product-utils'
import { useCart } from '@/components/cart/CartProvider'
import type { Product } from '@/payload-types'

type AddToCartButtonProps = {
  product: Product
  promoPercent?: number | null
  /**
   * 'full' is the product page's labelled button. 'icon' is the round one that
   * sits beside the price on a grid card, where there is no room for a label —
   * the product name comes from the surrounding card, so it goes in aria-label.
   */
  variant?: 'full' | 'icon'
}

export function AddToCartButton({
  product,
  promoPercent,
  variant = 'full',
}: AddToCartButtonProps) {
  const t = useTranslations('product')
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outOfStock = product.stockStatus === STOCK_STATUS.OUT
  const isIcon = variant === 'icon'

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (outOfStock) {
    return isIcon ? (
      <span
        aria-hidden
        title={t('outOfStock')}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-text-muted/50 ring-1 ring-line"
      >
        <CartIcon />
      </span>
    ) : (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-full bg-paper-sunk px-7 py-3 font-semibold text-text-muted/70 ring-1 ring-line"
      >
        {t('outOfStock')}
      </button>
    )
  }

  function handleClick() {
    addItem({
      productId: product.id,
      sku: product.sku,
      title: product.title,
      priceDkk: product.priceDkk,
      unit: product.unit,
      promoPercent: promoPercent ?? null,
      imageUrl: getProductImageUrl(product),
    })
    setAdded(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAdded(false), 1500)
  }

  if (isIcon) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${t('addToCart')} — ${product.title}`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cream shadow-soft transition-all duration-500 ease-glide hover:shadow-lift hover:scale-105 active:scale-95 ${
          added ? 'bg-success' : 'bg-burgundy hover:bg-burgundy-dark'
        }`}
      >
        {added ? <CheckIcon /> : <CartIcon />}
        <span aria-live="polite" className="sr-only">
          {added ? t('addedToCart') : ''}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex w-full items-center justify-center gap-3 rounded-full py-2 pl-7 pr-5 font-semibold text-cream shadow-soft transition-all duration-500 ease-glide hover:shadow-lift active:scale-[0.98] ${
        added ? 'bg-success' : 'bg-burgundy hover:bg-burgundy-dark'
      }`}
    >
      <span>{added ? t('addedToCart') : t('addToCart')}</span>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/15 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:scale-105"
        aria-hidden
      >
        {added ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </span>
      <span aria-live="polite" className="sr-only">
        {added ? t('addedToCart') : ''}
      </span>
    </button>
  )
}

/* A basket rather than a plus: on a card the icon is the only label the button
   has, so it should say what it does, not just "add". */
function CartIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.55L21 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}

export function ContinueShoppingLink() {
  const t = useTranslations('cart')
  return (
    <Link
      href="/shop"
      className="font-medium text-burgundy underline decoration-gold decoration-1 underline-offset-4 transition-colors duration-300 hover:text-burgundy-dark hover:decoration-burgundy"
    >
      {t('continueShopping')}
    </Link>
  )
}
