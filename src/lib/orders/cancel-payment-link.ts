import { ORDER_STATUS } from '@/lib/contracts'
import { getPaymentGateway } from '@/lib/payment'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

export type CancelPaymentLinkResult =
  | {
      ok: true
      order: Order
      sessionCancelled: boolean
      sessionNotFound: boolean
    }
  | {
      ok: false
      error: string
      status: number
    }

/**
 * Cancel an active payment link so the order can be edited and a new link sent.
 *
 * Calls Frisbii Checkout API `DELETE /v1/session/{id}` when paymentReference
 * is set (see https://docs.frisbii.com/reference/deletesession). A 404 is
 * treated as already expired/deleted. Local fields are always cleared and status
 * reverts to awaiting_confirmation.
 */
export async function cancelPaymentLink(
  orderId: number | string,
): Promise<CancelPaymentLinkResult> {
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

  if (order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    return {
      ok: false,
      error: `Order must be in "${ORDER_STATUS.AWAITING_PAYMENT}" status (current: ${order.status})`,
      status: 400,
    }
  }

  let sessionCancelled = false
  let sessionNotFound = false

  const sessionId = order.paymentReference?.trim()
  if (sessionId) {
    const gateway = getPaymentGateway()
    const cancelResult = await gateway.cancelPaymentSession(sessionId)

    if (cancelResult.ok) {
      sessionCancelled = true
    } else if (cancelResult.notFound) {
      sessionNotFound = true
    } else {
      return {
        ok: false,
        error: cancelResult.error,
        status: 502,
      }
    }
  }

  const updated = (await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      status: ORDER_STATUS.AWAITING_CONFIRMATION,
      paymentLinkUrl: null,
      paymentReference: null,
    },
  })) as Order

  return {
    ok: true,
    order: updated,
    sessionCancelled,
    sessionNotFound,
  }
}
