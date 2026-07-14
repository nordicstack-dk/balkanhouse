'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { submitCheckout } from '@/app/(frontend)/actions/checkout'
import { useCart } from '@/components/cart/CartProvider'
import { Link, useRouter } from '@/i18n/navigation'
import { applyPromo, formatPriceDkk } from '@/lib/pricing'
import { cartSubtotal } from '@/lib/cart'

export function CheckoutForm() {
  const t = useTranslations('checkout')
  const router = useRouter()
  const { items, clearCart, hydrated } = useCart()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pickupNotes, setPickupNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!hydrated) {
    return <p className="text-text-muted">{t('loading')}</p>
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-cream-dark bg-white p-8 text-center">
        <p className="text-lg text-text-muted">{t('emptyCart')}</p>
        <Link
          href="/cos"
          className="mt-4 inline-block text-burgundy underline hover:text-burgundy-dark"
        >
          {t('backToCart')}
        </Link>
      </div>
    )
  }

  const subtotal = cartSubtotal(items)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await submitCheckout(
      { firstName, lastName, email, phone, pickupNotes },
      items,
    )

    if (!result.ok) {
      const errorMessages: Record<string, string> = {
        empty_cart: t('errors.empty_cart'),
        missing_fields: t('errors.missing_fields'),
        invalid_email: t('errors.invalid_email'),
        server_error: t('errors.server_error'),
      }
      setError(errorMessages[result.error] ?? t('errors.server_error'))
      setSubmitting(false)
      return
    }

    clearCart()
    router.push(`/checkout/confirmation?order=${encodeURIComponent(result.orderNumber)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-cream-dark bg-white p-6">
        <h2 className="text-lg font-semibold text-text">{t('contactDetails')}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-text">
              {t('firstName')}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-cream-dark px-3 py-2 text-text focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-text">
              {t('lastName')}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-cream-dark px-3 py-2 text-text focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-cream-dark px-3 py-2 text-text focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-text">
            {t('phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-cream-dark px-3 py-2 text-text focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
          />
        </div>

        <div>
          <label htmlFor="pickupNotes" className="mb-1 block text-sm font-medium text-text">
            {t('pickupNotes')}
          </label>
          <textarea
            id="pickupNotes"
            name="pickupNotes"
            rows={3}
            value={pickupNotes}
            onChange={(e) => setPickupNotes(e.target.value)}
            placeholder={t('pickupNotesPlaceholder')}
            className="w-full rounded-lg border border-cream-dark px-3 py-2 text-text focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
          />
        </div>

        <p className="text-sm text-text-muted">{t('pickupInfo')}</p>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-burgundy py-3 font-semibold text-cream transition hover:bg-burgundy-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('submitting') : t('submitOrder')}
        </button>
      </div>

      <div className="rounded-xl border border-cream-dark bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">{t('orderSummary')}</h2>
        <ul className="divide-y divide-cream-dark">
          {items.map((item) => {
            const unitPrice = applyPromo(item.priceDkk, item.promoPercent)
            return (
              <li key={item.productId} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-text">
                  {item.title} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium text-burgundy">
                  {formatPriceDkk(unitPrice * item.quantity)}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex justify-between border-t border-cream-dark pt-4 text-lg font-bold">
          <span>{t('subtotal')}</span>
          <span className="text-burgundy">{formatPriceDkk(subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-text-muted">{t('paymentLater')}</p>
      </div>
    </form>
  )
}
