import { ORDER_STATUS } from '@/lib/contracts'
import { verifyPaymentOnReturn } from '@/lib/orders/verify-payment-return'
import { getPayloadClient } from '@/lib/payload'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ order?: string }>
}

// Cap the function so a slow DB/gateway can never hang the return page to the
// platform ceiling (prod logs 2026-07-20 showed a 300s runtime timeout here).
export const maxDuration = 20

export default async function CheckoutConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { order: orderNumber } = await searchParams
  setRequestLocale(locale as Locale)

  const t = await getTranslations('checkout')

  let paymentVerified = false

  if (orderNumber) {
    // Verify the charge with Frisbii and mark the order paid on return. This is
    // the reliable confirmation path — the async webhook may be delayed or not
    // yet configured, so the customer's return is when we confirm payment.
    // applyPaymentWebhook underneath is idempotent, so racing the webhook is safe.
    //
    // Crucially, this must NEVER surface an error to a customer who just paid:
    // a slow or unavailable DB/gateway degrades to the order-received view
    // (the webhook, or a refresh, reconciles the paid status), instead of a
    // 500/504. A 12s race guarantees the page returns promptly regardless.
    try {
      const payload = await getPayloadClient()
      const verification = await Promise.race([
        verifyPaymentOnReturn(payload, orderNumber),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12_000)),
      ])
      paymentVerified =
        !!verification &&
        (verification.applied || verification.order?.status === ORDER_STATUS.PAID)
    } catch (err) {
      console.error('[confirmation] payment verification failed; showing received state', err)
    }
  }

  const isPaymentConfirmation = paymentVerified

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-cream-dark bg-white p-8 text-center">
      <div className="mb-4 text-5xl text-success" aria-hidden>
        ✓
      </div>
      <h1 className="text-2xl font-bold text-text">
        {isPaymentConfirmation ? t('paymentConfirmedTitle') : t('confirmationTitle')}
      </h1>
      <p className="mt-4 text-text-muted">
        {isPaymentConfirmation ? t('paymentConfirmedMessage') : t('confirmationMessage')}
      </p>
      {orderNumber && (
        <p className="mt-4 rounded-lg bg-cream px-4 py-3 font-mono text-sm text-text">
          {t('orderNumber')}: <strong>{orderNumber}</strong>
        </p>
      )}
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-lg bg-burgundy px-8 py-3 font-semibold text-cream transition hover:bg-burgundy-dark"
      >
        {t('backToShop')}
      </Link>
    </div>
  )
}
