'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk } from '@/lib/pricing'
import { cartSubtotal } from '@/lib/cart'
import { useCart } from '@/components/cart/CartProvider'

export function CartView() {
  const t = useTranslations('cart')
  const { items, updateQuantity, removeItem, hydrated } = useCart()

  if (!hydrated) {
    return <p className="text-text-muted">{t('title')}...</p>
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-cream-dark bg-white p-8 text-center">
        <p className="text-lg text-text-muted">{t('empty')}</p>
        <Link
          href="/shop"
          className="mt-4 inline-block text-burgundy underline hover:text-burgundy-dark"
        >
          {t('continueShopping')}
        </Link>
      </div>
    )
  }

  const subtotal = cartSubtotal(items)

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-cream-dark rounded-xl border border-cream-dark bg-white">
        {items.map((item) => {
          const unitPrice = applyPromo(item.priceDkk, item.promoPercent)
          return (
            <li key={item.productId} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produs/${encodeURIComponent(item.sku)}`}
                  className="font-semibold text-text hover:text-burgundy"
                >
                  {item.title ?? item.sku}
                </Link>
                <p className="text-sm text-text-muted">
                  {formatPriceDkk(unitPrice)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`qty-${item.productId}`}>
                  {t('quantity')}
                </label>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded border border-cream-dark hover:bg-cream-dark"
                  aria-label="-"
                >
                  −
                </button>
                <input
                  id={`qty-${item.productId}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                  }
                  className="w-14 rounded border border-cream-dark px-2 py-1 text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded border border-cream-dark hover:bg-cream-dark"
                  aria-label="+"
                >
                  +
                </button>
              </div>
              <p className="w-24 text-right font-semibold text-burgundy">
                {formatPriceDkk(unitPrice * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-sm text-danger hover:underline"
              >
                {t('remove')}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col items-end gap-4 rounded-xl border border-cream-dark bg-white p-6">
        <div className="flex w-full max-w-xs justify-between text-lg">
          <span>{t('subtotal')}</span>
          <span className="font-bold text-burgundy">{formatPriceDkk(subtotal)}</span>
        </div>
        <Link
          href="/checkout"
          className="w-full max-w-xs rounded-lg bg-burgundy py-3 text-center font-semibold text-cream transition hover:bg-burgundy-dark"
        >
          {t('submitOrder')}
        </Link>
      </div>
    </div>
  )
}
