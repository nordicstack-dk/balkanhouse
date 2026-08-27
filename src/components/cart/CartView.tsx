'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk } from '@/lib/pricing'
import { cartSubtotal } from '@/lib/cart'
import { useCart } from '@/components/cart/CartProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { WovenMark } from '@/components/ui/WovenMark'

/* Round wells on paper rather than square bordered boxes; they press down under
   the pointer so the stepper feels physical. */
const qtyButtonClassName =
  'flex h-9 w-9 items-center justify-center rounded-full bg-paper text-text shadow-soft ring-1 ring-line transition-all duration-300 ease-glide hover:text-burgundy hover:ring-gold/50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none disabled:hover:text-text disabled:hover:ring-line'

const panelClassName = 'rounded-core bg-paper shadow-soft ring-1 ring-line/60'

export function CartView() {
  const t = useTranslations('cart')
  const { items, updateQuantity, removeItem, hydrated } = useCart()

  if (!hydrated) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className={panelClassName}>
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-core" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className={`flex flex-col items-end gap-4 p-6 ${panelClassName}`}>
          <Skeleton className="h-6 w-full max-w-xs" />
          <Skeleton className="h-12 w-full max-w-xs rounded-full" />
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className={`p-12 text-center ${panelClassName}`}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-5 text-wood-light"
          aria-hidden
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p className="text-lg text-text-muted">{t('empty')}</p>
        <Link
          href="/shop"
          className="mt-7 inline-block rounded-full bg-burgundy px-7 py-3 font-semibold text-cream shadow-soft transition-all duration-500 ease-glide hover:bg-burgundy-dark hover:shadow-lift active:scale-[0.98]"
        >
          {t('continueShopping')}
        </Link>
      </div>
    )
  }

  const subtotal = cartSubtotal(items)

  return (
    <div className="space-y-6">
      <ul className={`divide-y divide-line/70 ${panelClassName}`}>
        {items.map((item) => {
          const unitPrice = applyPromo(item.priceDkk, item.promoPercent)
          return (
            <li
              key={item.productId}
              className="flex flex-wrap items-center gap-4 p-4 transition-colors duration-300 first:rounded-t-core last:rounded-b-core hover:bg-cream/40"
            >
              <Link
                href={`/produs/${encodeURIComponent(item.sku)}`}
                className="rounded-tag relative block h-14 w-14 shrink-0 overflow-hidden bg-paper-sunk ring-1 ring-line transition-shadow duration-300 ease-glide hover:shadow-soft"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-wood-light" aria-hidden>
                    <WovenMark size={26} />
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/produs/${encodeURIComponent(item.sku)}`}
                  className="font-semibold text-text transition-colors duration-300 hover:text-burgundy"
                >
                  {item.title ?? item.sku}
                </Link>
                <p className="bh-nums text-sm text-text-muted">
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
                  className="bh-nums w-14 rounded-full bg-paper px-2 py-1.5 text-center text-sm shadow-soft ring-1 ring-line transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-burgundy"
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
              <p className="bh-nums w-24 text-right font-semibold tracking-tight text-burgundy">
                {formatPriceDkk(unitPrice * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-danger transition-colors duration-300 hover:bg-danger/10"
              >
                {t('remove')}
              </button>
            </li>
          )
        })}
      </ul>

      <div className={`flex flex-col items-end gap-4 p-6 ${panelClassName}`}>
        <div className="flex w-full max-w-xs items-baseline justify-between text-lg">
          <span>{t('subtotal')}</span>
          <span className="bh-nums text-xl font-bold tracking-tight text-burgundy">
            {formatPriceDkk(subtotal)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="w-full max-w-xs rounded-full bg-burgundy py-3.5 text-center font-semibold text-cream shadow-soft transition-all duration-500 ease-glide hover:bg-burgundy-dark hover:shadow-lift active:scale-[0.98]"
        >
          {t('submitOrder')}
        </Link>
      </div>
    </div>
  )
}
