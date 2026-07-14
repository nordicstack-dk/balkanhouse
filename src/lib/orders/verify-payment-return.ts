import { ORDER_STATUS } from '@/lib/contracts'
import { applyPaymentWebhook } from '@/lib/orders/apply-payment-webhook'
import { getPaymentGateway } from '@/lib/payment'
import { isSuccessfulChargeState, orderHandleFromId } from '@/lib/payment/frisbii'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'

export type VerifyPaymentReturnResult = {
  order: Order | null
  applied: boolean
  reason?: string
}

async function findOrderByNumber(payload: Payload, orderNumber: string): Promise<Order | null> {
  const trimmed = orderNumber.trim()
  if (!trimmed) {
    return null
  }

  const result = await payload.find({
    collection: 'orders',
    where: {
      orderNumber: { equals: trimmed },
    },
    limit: 1,
  })

  return (result.docs[0] as Order | undefined) ?? null
}

export async function verifyPaymentOnReturn(
  payload: Payload,
  orderNumber: string,
): Promise<VerifyPaymentReturnResult> {
  const order = await findOrderByNumber(payload, orderNumber)
  if (!order) {
    return { order: null, applied: false, reason: 'order_not_found' }
  }

  if (order.status === ORDER_STATUS.PAID) {
    return { order, applied: false, reason: 'already_paid' }
  }

  if (order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    return { order, applied: false, reason: 'not_awaiting_payment' }
  }

  const gateway = getPaymentGateway()
  const chargeHandle = orderHandleFromId(order.id)
  const chargeState = await gateway.getChargeState(chargeHandle)

  console.log('[payment return] charge verification', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    chargeHandle,
    chargeState,
  })

  if (!isSuccessfulChargeState(chargeState)) {
    return { order, applied: false, reason: 'charge_not_paid' }
  }

  const outcome = await applyPaymentWebhook(payload, {
    orderId: chargeHandle,
    paymentReference: order.paymentReference ?? chargeHandle,
    status: 'paid',
    eventType: 'return_url_verification',
  })

  if (!outcome.applied) {
    return { order, applied: false, reason: outcome.reason ?? 'apply_failed' }
  }

  const updated = (await payload.findByID({
    collection: 'orders',
    id: order.id,
  })) as Order

  return { order: updated, applied: true }
}
