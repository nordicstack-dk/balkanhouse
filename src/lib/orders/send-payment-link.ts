import { ORDER_STATUS } from '@/lib/contracts'
import { sendPaymentLink as sendPaymentLinkEmail } from '@/lib/email/send-order-email'
import { getPaymentGateway } from '@/lib/payment'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

const PAYMENT_PROVIDER = 'flatpay'

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

function getServerUrl(): string {
  return process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
}

function buildReturnUrl(orderNumber: string): string {
  const base = getServerUrl().replace(/\/$/, '')
  return `${base}/da/checkout/confirmation?order=${encodeURIComponent(orderNumber)}`
}

export async function sendPaymentLink(orderId: number | string): Promise<SendPaymentLinkResult> {
  const payload = await getPayloadClient()

  let order: Order
  try {
    order = (await payload.findByID({
      collection: 'orders',
      id: orderId,
    })) as Order
  } catch {
    return { ok: false, error: 'Order not found', status: 404 }
  }

  if (order.status !== ORDER_STATUS.AWAITING_CONFIRMATION) {
    return {
      ok: false,
      error: `Order must be in "${ORDER_STATUS.AWAITING_CONFIRMATION}" status (current: ${order.status})`,
      status: 400,
    }
  }

  if (!order.customerEmail?.trim()) {
    return { ok: false, error: 'Order is missing customer email', status: 400 }
  }

  if (order.totalDkk <= 0) {
    return { ok: false, error: 'Order total must be greater than zero', status: 400 }
  }

  const gateway = getPaymentGateway()
  const { paymentLinkUrl, paymentReference } = await gateway.createPaymentLink({
    orderId: order.id,
    amountDkk: order.totalDkk,
    currency: 'DKK',
    customerEmail: order.customerEmail,
    returnUrl: buildReturnUrl(order.orderNumber),
  })

  const updated = (await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: ORDER_STATUS.AWAITING_PAYMENT,
      paymentProvider: PAYMENT_PROVIDER,
      paymentReference,
      paymentLinkUrl,
    },
  })) as Order

  const emailResult = await sendPaymentLinkEmail(updated, paymentLinkUrl)
  if (!emailResult.ok) {
    console.error(
      '[email] payment link email failed:',
      emailResult.error,
      '→',
      updated.customerEmail,
    )
  }

  return {
    ok: true,
    order: updated,
    paymentLinkUrl,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.error,
  }
}
