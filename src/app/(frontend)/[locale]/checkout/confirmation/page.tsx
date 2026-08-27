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
    <div className="rounded-shell mx-auto max-w-lg bg-paper p-10 text-center shadow-lift ring-1 ring-line/60">
      {/* Drawn check in its own well — the ✓ glyph rendered at a different weight
          and baseline in every font that happened to serve it. */}
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success ring-1 ring-success/25"
        aria-hidden
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-text">
        {isPaymentConfirmation ? t('paymentConfirmedTitle') : t('confirmationTitle')}
      </h1>
      <p className="mx-auto mt-4 max-w-sm leading-relaxed text-text-muted">
        {isPaymentConfirmation ? t('paymentConfirmedMessage') : t('confirmationMessage')}
      </p>
      {orderNumber && (
        <p className="rounded-core bh-nums mt-6 bg-cream px-4 py-3 text-sm text-text ring-1 ring-line">
          <span className="text-text-muted">{t('orderNumber')}: </span>
          <strong className="font-semibold tracking-wide">{orderNumber}</strong>
        </p>
      )}
      <Link
        href="/shop"
        className="group mt-8 inline-flex items-center gap-3 rounded-full bg-burgundy py-2 pl-7 pr-2 font-semibold text-cream shadow-soft transition-all duration-500 ease-glide hover:bg-burgundy-dark hover:shadow-lift active:scale-[0.98]"
      >
        {t('backToShop')}
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:scale-105"
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </div>
  )
}
