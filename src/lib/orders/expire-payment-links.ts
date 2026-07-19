import { ORDER_STATUS } from '@/lib/contracts'
import { sendOrderCancelled } from '@/lib/email/send-order-email'
import { createLogger } from '@/lib/log'
import { cancelOrderPaymentSession } from '@/lib/orders/cancel-payment-link'
import { getPayloadClient } from '@/lib/payload'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'

const log = createLogger('expire-payment-links')

const BATCH_SIZE = 100
// Stop cleanly before the route's maxDuration (60s) so a large backlog is drained
// across runs instead of the platform killing the function mid-batch (audit F21).
const TIME_BUDGET_MS = 50_000
// Process the gateway + DB + email work for several orders at once, but bounded
// so we never stampede Frisbii/Resend (audit F21).
const CONCURRENCY = 5

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

type OrderOutcome =
  | { kind: 'expired'; orderNumber: string }
  | { kind: 'skipped'; orderNumber: string; error: string }
  | { kind: 'noop' }

/** Run an async mapper over items with a bounded number of concurrent workers. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await fn(items[current])
    }
  })
  await Promise.all(workers)
  return results
}

async function expireOneOrder(
  payload: Payload,
  order: Order,
): Promise<OrderOutcome> {
  // Re-read the order right before mutating it. The batch snapshot can be stale —
  // a customer may have paid since — and an unconditional cancel would clobber a
  // paid order to cancelled with no refund (audit F3).
  const fresh = (await payload.findByID({
    collection: 'orders',
    id: order.id,
    depth: 0,
  })) as Order
  if (fresh.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    log.info('skip: no longer awaiting payment', {
      orderNumber: order.orderNumber,
      status: fresh.status,
    })
    return { kind: 'noop' }
  }

  const sessionResult = await cancelOrderPaymentSession(fresh)
  if (!sessionResult.ok) {
    log.error('session cancel failed', {
      orderNumber: order.orderNumber,
      error: sessionResult.error,
    })
    return { kind: 'skipped', orderNumber: order.orderNumber, error: sessionResult.error }
  }

  // Conditional update: only cancel while still awaiting_payment. If a payment
  // landed in the meantime, zero rows match and we skip — the paid order is never
  // overwritten (audit F3). skipStatusEmail defers the email to below, post-commit,
  // so a rolled-back update can't emit a phantom cancellation.
  const cancelResult = await payload.update({
    collection: 'orders',
    where: {
      id: { equals: order.id },
      status: { equals: ORDER_STATUS.AWAITING_PAYMENT },
    },
    data: {
      status: ORDER_STATUS.CANCELLED,
      paymentLinkUrl: null,
      paymentReference: null,
      paymentLinkSentAt: null,
    },
    context: { skipStatusEmail: true },
  })

  const cancelled = cancelResult.docs[0] as Order | undefined
  if (!cancelled) {
    log.info('skip: status changed during expiry', { orderNumber: order.orderNumber })
    return { kind: 'noop' }
  }

  log.info('expired', {
    orderNumber: order.orderNumber,
    sessionCancelled: sessionResult.sessionCancelled,
    sessionNotFound: sessionResult.sessionNotFound,
  })

  // Best-effort, post-commit: a Resend hiccup must not fail the run.
  await sendOrderCancelled(cancelled).catch((err) => {
    log.error('cancellation email failed', { orderId: cancelled.id, err })
  })

  return { kind: 'expired', orderNumber: order.orderNumber }
}

export async function expirePaymentLinks(): Promise<ExpirePaymentLinksResult> {
  const payload = await getPayloadClient()
  const expiryHours = getPaymentLinkExpiryHours()
  const cutoff = new Date(Date.now() - expiryHours * 60 * 60 * 1000)
  const startedAt = Date.now()

  log.info('run started', { expiryHours, cutoff: cutoff.toISOString() })

  const orderNumbers: string[] = []
  const skipped: ExpirePaymentLinksResult['skipped'] = []

  // Keyset pagination by id: processing an order removes it from the
  // awaiting_payment set, so offset paging would step over rows that shift into a
  // previous window. Advancing a strictly-increasing id cursor visits every
  // awaiting_payment order exactly once, immune to the set shrinking (audit F22).
  let cursorId = 0

  while (true) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      log.warn('time budget reached; remaining orders deferred to the next run', {
        expiredSoFar: orderNumbers.length,
      })
      break
    }

    const result = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { status: { equals: ORDER_STATUS.AWAITING_PAYMENT } },
          { id: { greater_than: cursorId } },
        ],
      },
      limit: BATCH_SIZE,
      sort: 'id',
      depth: 0,
    })

    const orders = result.docs as Order[]
    if (orders.length === 0) {
      break
    }
    cursorId = orders[orders.length - 1].id

    const expired = orders.filter((order) => isPaymentLinkExpired(order, cutoff))
    const outcomes = await mapWithConcurrency(expired, CONCURRENCY, (order) =>
      expireOneOrder(payload, order),
    )

    for (const outcome of outcomes) {
      if (outcome.kind === 'expired') {
        orderNumbers.push(outcome.orderNumber)
      } else if (outcome.kind === 'skipped') {
        skipped.push({ orderNumber: outcome.orderNumber, error: outcome.error })
      }
    }

    if (orders.length < BATCH_SIZE) {
      break
    }
  }

  log.info('run finished', { expired: orderNumbers.length, skipped: skipped.length })

  return {
    expired: orderNumbers.length,
    orderNumbers,
    skipped,
  }
}
