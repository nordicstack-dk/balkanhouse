import { ORDER_STATUS, type OrderStatus } from '@/lib/contracts'
import { getPayloadClient } from '@/lib/payload'

/**
 * Order states that wait on the shop, not on the customer. `awaiting_payment`
 * is deliberately absent: that one waits on the customer paying, so counting it
 * here would train the operator to ignore the panel.
 */
const ACTIONABLE: { status: OrderStatus; label: string; action: string }[] = [
  {
    status: ORDER_STATUS.AWAITING_CONFIRMATION,
    label: 'Awaiting confirmation',
    action: 'Confirm, then send the payment link',
  },
  {
    status: ORDER_STATUS.PAID,
    label: 'Paid — ready to ship',
    action: 'Dispatch, then mark as shipped',
  },
]

export type AttentionBucket = {
  status: OrderStatus
  label: string
  action: string
  count: number
  /** Creation date of the longest-waiting order in this bucket. */
  oldestAt: string | null
  /** Deep link into the orders list, pre-filtered to this status. */
  href: string
}

export type OrdersAttention = {
  buckets: AttentionBucket[]
  total: number
}

export function ordersListHref(status: OrderStatus): string {
  return `/admin/collections/orders?where[status][equals]=${status}`
}

/**
 * One query per bucket: `find` with limit 1 sorted oldest-first yields both the
 * total and the longest-waiting order, so the panel costs two queries rather
 * than a count plus a lookup for each.
 */
export async function getOrdersNeedingAttention(): Promise<OrdersAttention> {
  const payload = await getPayloadClient()

  const buckets = await Promise.all(
    ACTIONABLE.map(async ({ status, label, action }): Promise<AttentionBucket> => {
      const result = await payload.find({
        collection: 'orders',
        where: { status: { equals: status } },
        sort: 'createdAt',
        limit: 1,
        depth: 0,
      })

      return {
        status,
        label,
        action,
        count: result.totalDocs,
        oldestAt: result.docs[0]?.createdAt ?? null,
        href: ordersListHref(status),
      }
    }),
  )

  return {
    buckets,
    total: buckets.reduce((sum, b) => sum + b.count, 0),
  }
}

/** Compact age for the longest-waiting order, e.g. "4 days". */
export function waitingFor(oldestAt: string | null): string | null {
  if (!oldestAt) return null
  const ms = Date.now() - new Date(oldestAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null

  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}
