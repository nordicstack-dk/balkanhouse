import { ORDER_STATUS } from '@/lib/contracts'
import { getPayloadClient } from '@/lib/payload'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Order } from '@/payload-types'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { order: orderNumber } = await searchParams
  setRequestLocale(locale as Locale)

  const t = await getTranslations('checkout')

  let paymentVerified = false

  if (orderNumber) {
    // Read-only: the Frisbii webhook is the source of truth for paid status
    // (audit F26, decision 8). This page no longer performs a gateway call or a
    // DB write during render — it only reflects the current order status, so it
    // is safe under RSC re-invocation and cannot be used to probe/mutate state.
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: orderNumber } },
      limit: 1,
      depth: 0,
    })
    const order = result.docs[0] as Order | undefined
    paymentVerified = order?.status === ORDER_STATUS.PAID
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
