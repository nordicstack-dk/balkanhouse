import { Webhook } from 'svix'

import { applyEmailWebhook, type ResendWebhookEvent } from '@/lib/orders/apply-email-webhook'
import { getPayloadClient } from '@/lib/payload'

/**
 * Resend email webhook. Records delivery lifecycle events (delivered, opened,
 * clicked, bounced, complained, failed) against the matching `order-emails`
 * row so the order page can show email status.
 *
 * Configure in Resend → Webhooks with endpoint
 * `<NEXT_PUBLIC_SERVER_URL>/api/webhooks/resend` and set RESEND_WEBHOOK_SECRET
 * to the signing secret shown there.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()

  let event: ResendWebhookEvent
  try {
    if (secret) {
      const headers = {
        'svix-id': request.headers.get('svix-id') ?? '',
        'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
        'svix-signature': request.headers.get('svix-signature') ?? '',
      }
      event = new Webhook(secret).verify(rawBody, headers) as ResendWebhookEvent
    } else if (process.env.NODE_ENV === 'production') {
      // Fail closed: don't trust an unsigned body in production (audit F9).
      console.error('[resend webhook] RESEND_WEBHOOK_SECRET not set — refusing unverified webhook')
      return Response.json({ error: 'Webhook not configured' }, { status: 500 })
    } else {
      console.warn(
        '[resend webhook] RESEND_WEBHOOK_SECRET not set; skipping signature verification (non-production only)',
      )
      event = JSON.parse(rawBody) as ResendWebhookEvent
    }
  } catch (err) {
    console.error('[resend webhook] signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = await getPayloadClient()
    const outcome = await applyEmailWebhook(payload, event)

    console.log('[resend webhook] processed', {
      eventType: event.type,
      emailId: event.data?.email_id,
      applied: outcome.applied,
      reason: outcome.reason,
      orderEmailId: outcome.orderEmailId,
    })

    return Response.json({ ok: true, ...outcome })
  } catch (err) {
    console.error('[resend webhook] error', err)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
