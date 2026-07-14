import { ORDER_STATUS, type OrderStatus } from '@/lib/contracts'
import { orderHandleFromId } from '@/lib/payment/frisbii'
import type { PaymentWebhookResult } from '@/lib/payment/types'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'

function parseOrderId(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && String(parsed) === value ? parsed : null
}

async function findOrderForWebhook(
  payload: Payload,
  result: PaymentWebhookResult,
): Promise<Order | null> {
  const invoice = result.orderId.trim()
  const sessionId = result.sessionId?.trim() ?? result.paymentReference.trim()

  if (sessionId) {
    const bySession = await payload.find({
      collection: 'orders',
      where: {
        paymentReference: { equals: sessionId },
      },
      limit: 1,
    })

    if (bySession.docs[0]) {
      return bySession.docs[0] as Order
    }
  }

  if (!invoice) {
    return null
  }

  const byId = parseOrderId(invoice)
  if (byId !== null) {
    try {
      return (await payload.findByID({ collection: 'orders', id: byId })) as Order
    } catch {
      // fall through
    }
  }

  const byReference = await payload.find({
    collection: 'orders',
    where: {
      paymentReference: { equals: invoice },
    },
    limit: 1,
  })

  if (byReference.docs[0]) {
    return byReference.docs[0] as Order
  }

  const orders = await payload.find({
    collection: 'orders',
    limit: 200,
    sort: '-updatedAt',
  })

  return (
    (orders.docs as Order[]).find((order) => orderHandleFromId(order.id) === invoice) ?? null
  )
}

function targetStatus(result: PaymentWebhookResult): OrderStatus | null {
  switch (result.status) {
    case 'paid':
      return ORDER_STATUS.PAID
    case 'cancelled':
      return ORDER_STATUS.CANCELLED
    default:
      return null
  }
}

export async function applyPaymentWebhook(
  payload: Payload,
  result: PaymentWebhookResult,
): Promise<{ applied: boolean; orderId?: number; reason?: string }> {
  const order = await findOrderForWebhook(payload, result)
  if (!order) {
    return { applied: false, reason: 'order_not_found' }
  }

  const nextStatus = targetStatus(result)
  if (!nextStatus) {
    return { applied: false, orderId: order.id, reason: 'no_status_change' }
  }

  if (order.status === nextStatus) {
    return { applied: false, orderId: order.id, reason: 'already_in_status' }
  }

  if (order.status === ORDER_STATUS.PAID && nextStatus === ORDER_STATUS.CANCELLED) {
    return { applied: false, orderId: order.id, reason: 'paid_order_protected' }
  }

  if (
    nextStatus === ORDER_STATUS.PAID &&
    order.status !== ORDER_STATUS.AWAITING_PAYMENT &&
    order.status !== ORDER_STATUS.AWAITING_CONFIRMATION
  ) {
    return { applied: false, orderId: order.id, reason: 'invalid_transition' }
  }

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: nextStatus,
      ...(nextStatus === ORDER_STATUS.PAID
        ? {
            paidAt: new Date().toISOString(),
            paymentReference: result.paymentReference || order.paymentReference,
          }
        : {}),
    },
  })

  return { applied: true, orderId: order.id }
}
