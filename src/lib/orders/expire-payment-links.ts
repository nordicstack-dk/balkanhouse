import { ORDER_STATUS } from '@/lib/contracts'
import { cancelOrderPaymentSession } from '@/lib/orders/cancel-payment-link'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

export function getPaymentLinkExpiryHours(): number {
  const raw = process.env.PAYMENT_LINK_EXPIRY_HOURS
  const parsed = raw ? Number.parseInt(raw, 10) : 72
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 72
}

function getPaymentLinkSentAt(order: Order): Date {
  return new Date(order.paymentLinkSentAt ?? order.updatedAt)
}

function isPaymentLinkExpired(order: Order, cutoff: Date): boolean {
  return getPaymentLinkSentAt(order) < cutoff
}

export type ExpirePaymentLinksResult = {
  expired: number
  orderNumbers: string[]
  skipped: { orderNumber: string; error: string }[]
}

export async function expirePaymentLinks(): Promise<ExpirePaymentLinksResult> {
  const payload = await getPayloadClient()
  const expiryHours = getPaymentLinkExpiryHours()
  const cutoff = new Date(Date.now() - expiryHours * 60 * 60 * 1000)

  const orderNumbers: string[] = []
  const skipped: ExpirePaymentLinksResult['skipped'] = []

  let page = 1
  const limit = 100

  while (true) {
    const result = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: ORDER_STATUS.AWAITING_PAYMENT },
      },
      limit,
      page,
      sort: 'updatedAt',
    })

    const orders = result.docs as Order[]
    if (orders.length === 0) {
      break
    }

    for (const order of orders) {
      if (!isPaymentLinkExpired(order, cutoff)) {
        continue
      }

      const sessionResult = await cancelOrderPaymentSession(order)
      if (!sessionResult.ok) {
        skipped.push({ orderNumber: order.orderNumber, error: sessionResult.error })
        console.error('[expire-payment-links] session cancel failed', {
          orderNumber: order.orderNumber,
          error: sessionResult.error,
        })
        continue
      }

      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: ORDER_STATUS.CANCELLED,
          paymentLinkUrl: null,
          paymentReference: null,
          paymentLinkSentAt: null,
        },
      })

      orderNumbers.push(order.orderNumber)
      console.log('[expire-payment-links] expired', {
        orderNumber: order.orderNumber,
        sessionCancelled: sessionResult.sessionCancelled,
        sessionNotFound: sessionResult.sessionNotFound,
      })
    }

    if (!result.hasNextPage) {
      break
    }

    page += 1
  }

  return {
    expired: orderNumbers.length,
    orderNumbers,
    skipped,
  }
}
