import { getPaymentGateway } from '@/lib/payment'
import { applyPaymentWebhook } from '@/lib/orders/apply-payment-webhook'
import { getPayloadClient } from '@/lib/payload'

// Give the handler room to ride out a Neon cold start (which can take 20s+) and
// mark the order paid, rather than being killed mid-write and forcing Frisbii
// to retry the whole event.
export const maxDuration = 60

export async function POST(request: Request) {
  const rawBody = await request.text()

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const headers = Object.fromEntries(request.headers.entries())
  const event = body as {
    event_type?: string
    invoice?: string
    payment_method_reference?: string
    event_id?: string
  }

  console.log('[flatpay webhook] received', {
    eventType: event.event_type,
    invoice: event.invoice,
    sessionId: event.payment_method_reference,
    eventId: event.event_id,
  })

  try {
    const gateway = getPaymentGateway()
    const result = await gateway.handleWebhook(body, headers)
    const payload = await getPayloadClient()
    const outcome = await applyPaymentWebhook(payload, result)

    console.log('[flatpay webhook] processed', {
      eventType: result.eventType,
      mappedStatus: result.status,
      orderLookupKey: result.orderId || result.sessionId || result.paymentReference,
      orderId: outcome.orderId,
      applied: outcome.applied,
      reason: outcome.reason,
    })

    if (outcome.reason === 'order_not_found') {
      console.warn('[flatpay webhook] order not found', {
        invoice: result.orderId,
        sessionId: result.sessionId,
        paymentReference: result.paymentReference,
        hint: 'Charge handle should match sanitized order id; session id is stored as paymentReference',
      })
    }

    if (result.status === 'pending') {
      console.log('[flatpay webhook] no status change for event', {
        eventType: result.eventType,
        hint: 'Subscribe to invoice_authorized and invoice_settled in Frisbii webhook settings',
      })
    }

    return Response.json({ ok: true, ...outcome })
  } catch (err) {
    console.error('[flatpay webhook] error', err)

    if (err instanceof Error && err.message.includes('signature')) {
      return Response.json(
        {
          error: 'Invalid signature',
          hint: 'Check FLATPAY_WEBHOOK_SECRET matches Frisbii webhook Secret key',
        },
        { status: 401 },
      )
    }

    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
