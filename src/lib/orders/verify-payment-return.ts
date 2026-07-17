import { ORDER_STATUS } from '@/lib/contracts'
import { createLogger } from '@/lib/log'
import { applyPaymentWebhook } from '@/lib/orders/apply-payment-webhook'
import { getPaymentGateway } from '@/lib/payment'
import { isSuccessfulChargeState, orderHandleFromId } from '@/lib/payment/frisbii'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'

const log = createLogger('payment-return')

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
  log.info('verifying', { orderNumber })

  const order = await findOrderByNumber(payload, orderNumber)
  if (!order) {
    log.warn('order not found', { orderNumber })
    return { order: null, applied: false, reason: 'order_not_found' }
  }

  if (order.status === ORDER_STATUS.PAID) {
    log.info('already paid', { orderId: order.id, orderNumber: order.orderNumber })
    return { order, applied: false, reason: 'already_paid' }
  }

  if (order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    log.info('not awaiting payment', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    })
    return { order, applied: false, reason: 'not_awaiting_payment' }
  }

  const gateway = getPaymentGateway()
  const chargeHandle = orderHandleFromId(order.id)
  const chargeState = await gateway.getChargeState(chargeHandle)

  log.info('charge verification', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    chargeHandle,
    chargeState,
  })

  if (!isSuccessfulChargeState(chargeState)) {
    log.info('charge not paid', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      chargeState,
    })
    return { order, applied: false, reason: 'charge_not_paid' }
  }

  const outcome = await applyPaymentWebhook(payload, {
    orderId: chargeHandle,
    paymentReference: order.paymentReference ?? chargeHandle,
    status: 'paid',
    eventType: 'return_url_verification',
  })

  if (!outcome.applied) {
    log.warn('apply failed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: outcome.reason ?? 'apply_failed',
    })
    return { order, applied: false, reason: outcome.reason ?? 'apply_failed' }
  }

  const updated = (await payload.findByID({
    collection: 'orders',
    id: order.id,
  })) as Order

  log.info('marked paid', { orderId: updated.id, orderNumber: updated.orderNumber })

  return { order: updated, applied: true }
}
