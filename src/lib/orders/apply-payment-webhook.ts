import { ORDER_STATUS, type OrderStatus } from '@/lib/contracts'
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

  // Primary, canonical match: the Frisbii `invoice` is the numeric order id
  // (orderHandleFromId(order.id)). Matching by id is reliable and avoids the
  // session-id vs payment_method_reference confusion that previously rejected
  // legitimate paid webhooks (audit F5, decision 2a).
  const byId = invoice ? parseOrderId(invoice) : null
  if (byId !== null) {
    try {
      return (await payload.findByID({
        collection: 'orders',
        id: byId,
        depth: 0,
      })) as Order
    } catch {
      // fall through to reference-based lookups
    }
  }

  // Fallbacks for reference-based routing / non-numeric invoices.
  const sessionId = result.sessionId?.trim() ?? result.paymentReference.trim()
  if (sessionId) {
    const bySession = await payload.find({
      collection: 'orders',
      where: { paymentReference: { equals: sessionId } },
      limit: 1,
      depth: 0,
    })
    if (bySession.docs[0]) {
      return bySession.docs[0] as Order
    }
  }

  if (invoice) {
    const byReference = await payload.find({
      collection: 'orders',
      where: { paymentReference: { equals: invoice } },
      limit: 1,
      depth: 0,
    })
    if (byReference.docs[0]) {
      return byReference.docs[0] as Order
    }
  }

  return null
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

  if (nextStatus === ORDER_STATUS.PAID && order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    return { applied: false, orderId: order.id, reason: 'invalid_transition' }
  }

  // Conditional (optimistic-concurrency) update: only write if the row is STILL
  // in the status we validated against. The Frisbii webhook and the return-URL
  // verification can fire near-simultaneously for one order, and webhooks are
  // delivered at-least-once — with a plain update-by-id both runs would apply.
  // Keyed on the expected status, only one UPDATE matches; a concurrent/replayed
  // apply matches zero rows and is an idempotent no-op, so there is no duplicate
  // paid transition, no duplicate confirmation email, and no paidAt overwrite
  // (audit F4 / F12).
  const expectedStatus = order.status
  const updateResult = await payload.update({
    collection: 'orders',
    where: {
      id: { equals: order.id },
      status: { equals: expectedStatus },
    },
    data: {
      status: nextStatus,
      ...(nextStatus === ORDER_STATUS.PAID
        ? {
            paidAt: new Date().toISOString(),
            // Prefer the reference we already stored (the checkout session id) so
            // a later cancel still resolves; only fill from the event if empty.
            paymentReference: order.paymentReference || result.paymentReference,
          }
        : {}),
    },
  })

  const updated = (updateResult.docs?.[0] ?? null) as Order | null
  if (!updated) {
    return { applied: false, orderId: order.id, reason: 'already_applied' }
  }

  return { applied: true, orderId: order.id }
}
