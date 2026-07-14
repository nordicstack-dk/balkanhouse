'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk } from '@/lib/pricing'
import { cartSubtotal } from '@/lib/cart'
import { useCart } from '@/components/cart/CartProvider'
import { LinkPendingSpinner } from '@/components/ui/LinkPendingSpinner'
import { Skeleton } from '@/components/ui/Skeleton'

const qtyButtonClassName =
  'flex h-8 w-8 items-center justify-center rounded border border-cream-dark transition-colors hover:bg-cream-dark active:bg-cream-dark/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

export function CartView() {
  const t = useTranslations('cart')
  const { items, updateQuantity, removeItem, hydrated } = useCart()

  if (!hydrated) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="rounded-xl border border-cream-dark bg-white">
          <div className="flex items-center gap-4 p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-4 rounded-xl border border-cream-dark bg-white p-6">
          <Skeleton className="h-6 w-full max-w-xs" />
          <Skeleton className="h-12 w-full max-w-xs" />
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-cream-dark bg-white p-10 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-4 text-wood-light"
          aria-hidden
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p className="text-lg text-text-muted">{t('empty')}</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-lg bg-burgundy px-6 py-3 font-semibold text-cream shadow-sm transition-all hover:bg-burgundy-dark hover:shadow-md active:scale-[0.98]"
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
                  className="font-semibold text-text transition-colors hover:text-burgundy"
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
                  disabled={item.quantity <= 1}
                  className={qtyButtonClassName}
                  aria-label={t('decreaseQuantity')}
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
                  className="w-14 rounded border border-cream-dark px-2 py-1 text-center text-sm focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className={qtyButtonClassName}
                  aria-label={t('increaseQuantity')}
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
                className="rounded px-2 py-1 text-sm text-danger transition-colors hover:bg-danger/10 hover:underline"
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
          className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-burgundy py-3 text-center font-semibold text-cream shadow-sm transition-all hover:bg-burgundy-dark hover:shadow-md active:scale-[0.98]"
        >
          {t('submitOrder')}
          <LinkPendingSpinner />
        </Link>
      </div>
    </div>
  )
}
