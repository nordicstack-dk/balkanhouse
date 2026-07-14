'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { submitCheckout } from '@/app/(frontend)/actions/checkout'
import { useCart } from '@/components/cart/CartProvider'
import { Link, useRouter } from '@/i18n/navigation'
import { SHIPPING_METHOD, type ShippingMethod } from '@/lib/contracts'
import { applyPromo, formatPriceDkk } from '@/lib/pricing'
import { cartSubtotal } from '@/lib/cart'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'

const inputClassName =
  'w-full rounded-lg border border-cream-dark px-3 py-2 text-text focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy'

export function CheckoutForm() {
  const t = useTranslations('checkout')
  const router = useRouter()
  const { items, clearCart, hydrated } = useCart()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(SHIPPING_METHOD.PICKUP)
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [pickupNotes, setPickupNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!hydrated) {
    return (
      <div aria-busy="true" className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-cream-dark bg-white p-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border border-cream-dark bg-white p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    )
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
      {
        firstName,
        lastName,
        email,
        phone,
        shippingMethod,
        address:
          shippingMethod === SHIPPING_METHOD.DELIVERY
            ? { street, city, postalCode }
            : undefined,
        pickupNotes: shippingMethod === SHIPPING_METHOD.PICKUP ? pickupNotes : undefined,
      },
      items,
    )

    if (!result.ok) {
      const errorMessages: Record<string, string> = {
        empty_cart: t('errors.empty_cart'),
        missing_fields: t('errors.missing_fields'),
        missing_address: t('errors.missing_address'),
        invalid_email: t('errors.invalid_email'),
        unavailable_products: t('errors.unavailable_products'),
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
              className={inputClassName}
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
              className={inputClassName}
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
            className={inputClassName}
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
            className={inputClassName}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium text-text">{t('shippingMethod')}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${
                shippingMethod === SHIPPING_METHOD.PICKUP
                  ? 'border-burgundy bg-burgundy/5 ring-1 ring-burgundy'
                  : 'border-cream-dark hover:border-burgundy/40'
              }`}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={SHIPPING_METHOD.PICKUP}
                checked={shippingMethod === SHIPPING_METHOD.PICKUP}
                onChange={() => setShippingMethod(SHIPPING_METHOD.PICKUP)}
                className="mt-1 accent-burgundy"
              />
              <span>
                <span className="block font-medium text-text">{t('shippingPickup')}</span>
                <span className="mt-0.5 block text-sm text-text-muted">{t('shippingPickupHint')}</span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${
                shippingMethod === SHIPPING_METHOD.DELIVERY
                  ? 'border-burgundy bg-burgundy/5 ring-1 ring-burgundy'
                  : 'border-cream-dark hover:border-burgundy/40'
              }`}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={SHIPPING_METHOD.DELIVERY}
                checked={shippingMethod === SHIPPING_METHOD.DELIVERY}
                onChange={() => setShippingMethod(SHIPPING_METHOD.DELIVERY)}
                className="mt-1 accent-burgundy"
              />
              <span>
                <span className="block font-medium text-text">{t('shippingDelivery')}</span>
                <span className="mt-0.5 block text-sm text-text-muted">
                  {t('shippingDeliveryHint')}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        {shippingMethod === SHIPPING_METHOD.DELIVERY && (
          <div className="space-y-4 rounded-lg border border-cream-dark bg-cream/30 p-4">
            <h3 className="text-sm font-semibold text-text">{t('deliveryAddress')}</h3>
            <div>
              <label htmlFor="street" className="mb-1 block text-sm font-medium text-text">
                {t('street')}
              </label>
              <input
                id="street"
                name="street"
                type="text"
                required
                autoComplete="street-address"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-text">
                  {t('city')}
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-text">
                  {t('postalCode')}
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  required
                  autoComplete="postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>
        )}

        {shippingMethod === SHIPPING_METHOD.PICKUP && (
          <>
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
                className={inputClassName}
              />
            </div>

            <p className="text-sm text-text-muted">{t('pickupInfo')}</p>
          </>
        )}

        {shippingMethod === SHIPPING_METHOD.DELIVERY && (
          <p className="text-sm text-text-muted">{t('deliveryInfo')}</p>
        )}

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-burgundy py-3 font-semibold text-cream shadow-sm transition-all hover:bg-burgundy-dark hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm disabled:active:scale-100"
        >
          {submitting && <Spinner className="h-4 w-4" />}
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
