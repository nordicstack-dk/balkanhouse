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
}

export function AddToCartButton({ product, promoPercent }: AddToCartButtonProps) {
  const t = useTranslations('product')
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outOfStock = product.stockStatus === STOCK_STATUS.OUT

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (outOfStock) {
    return (
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
