import { describe, it, expect, vi } from 'vitest'

import { ORDER_STATUS } from '@/lib/contracts'
import { applyPaymentWebhook } from '@/lib/orders/apply-payment-webhook'
import type { PaymentWebhookResult } from '@/lib/payment/types'

type FakeOrder = { id: number; status: string; paymentReference?: string | null }

/**
 * Minimal Payload stub. findByID resolves the order by numeric id (the canonical
 * webhook lookup); update() is the conditional (where-based) bulk update whose
 * matched-row count decides idempotency.
 */
function mockPayload(order: FakeOrder | null, updateDocs: FakeOrder[] = []) {
  return {
    findByID: vi.fn(async () => {
      if (!order) throw new Error('not found')
      return order
    }),
    find: vi.fn(async () => ({ docs: order ? [order] : [] })),
    update: vi.fn(async (_args: Record<string, unknown>) => ({ docs: updateDocs, errors: [] })),
  }
}

const paidResult = (orderId: string): PaymentWebhookResult => ({
  orderId,
  paymentReference: 'sess_1',
  status: 'paid',
  sessionId: 'sess_1',
  eventType: 'invoice_settled',
})

describe('applyPaymentWebhook', () => {
  it('returns order_not_found when the order does not exist', async () => {
    const payload = mockPayload(null)
    const outcome = await applyPaymentWebhook(payload as never, paidResult('999'))
    expect(outcome).toEqual({ applied: false, reason: 'order_not_found' })
  })

  it('marks an awaiting_payment order paid with a status-guarded conditional update', async () => {
    const order = { id: 5, status: ORDER_STATUS.AWAITING_PAYMENT, paymentReference: 'sess_1' }
    const payload = mockPayload(order, [{ ...order, status: ORDER_STATUS.PAID }])
    const outcome = await applyPaymentWebhook(payload as never, paidResult('5'))

    expect(outcome).toEqual({ applied: true, orderId: 5 })
    const call = payload.update.mock.calls[0][0] as unknown as {
      where: { status: { equals: string } }
      data: { status: string }
    }
    expect(call.where.status.equals).toBe(ORDER_STATUS.AWAITING_PAYMENT)
    expect(call.data.status).toBe(ORDER_STATUS.PAID)
  })

  it('is idempotent under a concurrent apply (zero rows matched)', async () => {
    const order = { id: 5, status: ORDER_STATUS.AWAITING_PAYMENT, paymentReference: 'sess_1' }
    const payload = mockPayload(order, []) // the other apply already transitioned the row
    const outcome = await applyPaymentWebhook(payload as never, paidResult('5'))
    expect(outcome).toEqual({ applied: false, orderId: 5, reason: 'already_applied' })
  })

  it('does not re-apply when the order is already paid', async () => {
    const order = { id: 5, status: ORDER_STATUS.PAID, paymentReference: 'sess_1' }
    const payload = mockPayload(order)
    const outcome = await applyPaymentWebhook(payload as never, paidResult('5'))
    expect(outcome).toEqual({ applied: false, orderId: 5, reason: 'already_in_status' })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('rejects paying an order that is not awaiting_payment', async () => {
    const order = { id: 5, status: ORDER_STATUS.AWAITING_CONFIRMATION, paymentReference: null }
    const payload = mockPayload(order)
    const outcome = await applyPaymentWebhook(payload as never, paidResult('5'))
    expect(outcome).toEqual({ applied: false, orderId: 5, reason: 'invalid_transition' })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('protects a paid order from a cancel webhook', async () => {
    const order = { id: 5, status: ORDER_STATUS.PAID, paymentReference: 'sess_1' }
    const payload = mockPayload(order)
    const outcome = await applyPaymentWebhook(payload as never, {
      orderId: '5',
      paymentReference: 'sess_1',
      status: 'cancelled',
      eventType: 'invoice_cancelled',
    })
    expect(outcome).toEqual({ applied: false, orderId: 5, reason: 'paid_order_protected' })
    expect(payload.update).not.toHaveBeenCalled()
  })
})
