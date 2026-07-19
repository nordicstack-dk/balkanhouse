import { routing, type Locale } from '@/i18n/routing'
import { ORDER_STATUS } from '@/lib/contracts'
import { sendPaymentLink as sendPaymentLinkEmail } from '@/lib/email/send-order-email'
import { getPaymentGateway, PAYMENT_PROVIDER } from '@/lib/payment'
import { createLogger, maskEmail } from '@/lib/log'
import { computeOrderTotals } from '@/lib/orders/order-totals'
import { getPayloadClient } from '@/lib/payload'
import { getServerUrl } from '@/lib/server-url'
import type { Order } from '@/payload-types'

const log = createLogger('payment-link')

export type SendPaymentLinkResult =
  | {
      ok: true
      order: Order
      paymentLinkUrl: string
      emailSent: boolean
      emailError?: string
    }
  | {
      ok: false
      error: string
      status: number
    }

function getOrderLocale(order: Order): Locale {
  const maybeLocale = (order as Order & { locale?: string }).locale
  if (maybeLocale && routing.locales.includes(maybeLocale as Locale)) {
    return maybeLocale as Locale
  }
  return routing.defaultLocale
}

function buildReturnUrl(order: Order): string {
  const base = getServerUrl()
  const locale = getOrderLocale(order)
  return `${base}/${locale}/checkout/confirmation?order=${encodeURIComponent(order.orderNumber)}`
}

export async function sendPaymentLink(orderId: number | string): Promise<SendPaymentLinkResult> {
  const payload = await getPayloadClient()

  log.info('requested', { orderId })

  let order: Order
  try {
    order = (await payload.findByID({
      collection: 'orders',
      id: orderId,
    })) as Order
  } catch {
    log.warn('rejected', { orderId, reason: 'order_not_found' })
    return { ok: false, error: 'Order not found', status: 404 }
  }

  if (order.status !== ORDER_STATUS.AWAITING_CONFIRMATION) {
    log.warn('rejected', { orderId, reason: 'wrong_status', status: order.status })
    return {
      ok: false,
      error: `Order must be in "${ORDER_STATUS.AWAITING_CONFIRMATION}" status (current: ${order.status})`,
      status: 400,
    }
  }

  if (!order.customerEmail?.trim()) {
    log.warn('rejected', { orderId, reason: 'missing_email' })
    return { ok: false, error: 'Order is missing customer email', status: 400 }
  }

  const totals = computeOrderTotals({
    lineItems: order.lineItems,
    shippingCostDkk: order.shippingCostDkk,
    discountDkk: order.discountDkk,
  })

  const totalsOutOfSync =
    totals.subtotalDkk !== order.subtotalDkk ||
    totals.totalDkk !== order.totalDkk ||
    order.lineItems.some((item, index) => item.lineTotalDkk !== totals.lineItems[index]?.lineTotalDkk)

  if (totalsOutOfSync) {
    order = (await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        lineItems: totals.lineItems as Order['lineItems'],
        subtotalDkk: totals.subtotalDkk,
        totalDkk: totals.totalDkk,
      },
    })) as Order
  }

  if (order.totalDkk <= 0) {
    log.warn('rejected', { orderId, reason: 'zero_total', totalDkk: order.totalDkk })
    return { ok: false, error: 'Order total must be greater than zero', status: 400 }
  }

  const gateway = getPaymentGateway()
  const { paymentLinkUrl, paymentReference } = await gateway.createPaymentLink({
    orderId: order.id,
    amountDkk: order.totalDkk,
    currency: 'DKK',
    customerEmail: order.customerEmail,
    returnUrl: buildReturnUrl(order),
  })

  log.info('gateway link created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentReference,
  })

  const updated = (await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: ORDER_STATUS.AWAITING_PAYMENT,
      paymentProvider: PAYMENT_PROVIDER,
      paymentReference,
      paymentLinkUrl,
      paymentLinkSentAt: new Date().toISOString(),
    },
  })) as Order

  const emailResult = await sendPaymentLinkEmail(updated, paymentLinkUrl)
  if (!emailResult.ok) {
    log.error('email failed', {
      orderId: updated.id,
      to: maskEmail(updated.customerEmail),
      error: emailResult.error,
    })
  } else {
    log.info('sent', { orderId: updated.id, orderNumber: updated.orderNumber })
  }

  return {
    ok: true,
    order: updated,
    paymentLinkUrl,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.error,
  }
}
