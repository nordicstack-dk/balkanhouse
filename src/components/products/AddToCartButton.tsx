'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { STOCK_STATUS } from '@/lib/contracts'
import { useCart } from '@/components/cart/CartProvider'
import type { Product } from '@/payload-types'

type AddToCartButtonProps = {
  product: Product
  promoPercent?: number | null
}

export function AddToCartButton({ product, promoPercent }: AddToCartButtonProps) {
  const t = useTranslations('product')
  const { addItem } = useCart()
  const outOfStock = product.stockStatus === STOCK_STATUS.OUT

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

  return (
    <button
      type="button"
      onClick={() =>
        addItem({
          productId: product.id,
          sku: product.sku,
          title: product.title,
          priceDkk: product.priceDkk,
          unit: product.unit,
          promoPercent: promoPercent ?? null,
        })
      }
      className="w-full rounded-lg bg-burgundy px-6 py-3 font-semibold text-cream transition hover:bg-burgundy-dark"
    >
      {t('addToCart')}
    </button>
  )
}

export function ContinueShoppingLink() {
  const t = useTranslations('cart')
  return (
    <Link href="/shop" className="text-burgundy underline hover:text-burgundy-dark">
      {t('continueShopping')}
    </Link>
  )
}
