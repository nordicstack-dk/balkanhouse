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
        className="w-full cursor-not-allowed rounded-lg bg-cream-dark px-6 py-3 font-semibold text-text-muted"
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
      className={`w-full rounded-lg px-6 py-3 font-semibold text-cream shadow-sm transition-all active:scale-[0.98] ${
        added
          ? 'bg-success'
          : 'bg-burgundy hover:bg-burgundy-dark hover:shadow-md'
      }`}
    >
      {added ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>✓</span>
          {t('addedToCart')}
        </span>
      ) : (
        t('addToCart')
      )}
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
      className="text-burgundy underline transition-colors hover:text-burgundy-dark"
    >
      {t('continueShopping')}
    </Link>
  )
}
