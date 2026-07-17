import { EMAIL_STATUS, EMAIL_TYPE, type EmailType } from '@/lib/contracts'
import { getFromEmail, getResendClient } from '@/lib/email/resend'
import {
  orderCancelledEmail,
  orderReceivedEmail,
  orderShippedEmail,
  paymentConfirmedEmail,
  paymentLinkEmail,
} from '@/lib/email/templates/order-emails'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

export type SendOrderEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

type SendOrderEmailParams = {
  order: Order
  emailType: EmailType
  to: string
  subject: string
  html: string
}

/**
 * Records the dispatched email as an `order-emails` row so its Resend delivery
 * lifecycle can be tracked and shown on the order page. Best-effort: a failure
 * here must never break email sending, so it only logs.
 */
async function recordSentEmail(params: {
  order: Order
  emailType: EmailType
  to: string
  subject: string
  resendId?: string
}): Promise<void> {
  try {
    const payload = await getPayloadClient()
    const now = new Date().toISOString()
    await payload.create({
      collection: 'order-emails',
      data: {
        order: params.order.id,
        emailType: params.emailType,
        resendId: params.resendId,
        to: params.to,
        subject: params.subject,
        status: EMAIL_STATUS.SENT,
        sentAt: now,
        lastEventAt: now,
      },
    })
  } catch (err) {
    console.error('[email] failed to record order-emails row:', err)
  }
}

async function sendOrderEmail(params: SendOrderEmailParams): Promise<SendOrderEmailResult> {
  const { order, emailType, to, subject, html } = params
  const client = getResendClient()
  if (!client) {
    console.warn('[email] RESEND_API_KEY not configured; skipping:', subject, '→', to)
    return { ok: false, error: 'not_configured' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
      // Tags let the Resend webhook map events back to the order even if the
      // order-emails row write below has not landed yet.
      tags: [
        { name: 'order_id', value: String(order.id) },
        { name: 'email_type', value: emailType },
      ],
    })

    if (error) {
      console.error('[email] Resend error:', { to, subject, error })
      return { ok: false, error: error.message }
    }

    await recordSentEmail({ order, emailType, to, subject, resendId: data?.id })

    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('[email] send failed:', { to, subject, err })
    const message = err instanceof Error ? err.message : 'send_failed'
    return { ok: false, error: message }
  }
}

function recipient(order: Order): string | null {
  const email = order.customerEmail?.trim()
  return email || null
}

export async function sendOrderReceived(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = orderReceivedEmail(order)
  return sendOrderEmail({ order, emailType: EMAIL_TYPE.ORDER_RECEIVED, to, subject, html })
}

export async function sendPaymentLink(
  order: Order,
  paymentLinkUrl: string,
): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = paymentLinkEmail(order, paymentLinkUrl)
  return sendOrderEmail({ order, emailType: EMAIL_TYPE.PAYMENT_LINK, to, subject, html })
}

export async function sendPaymentConfirmed(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = paymentConfirmedEmail(order)
  return sendOrderEmail({ order, emailType: EMAIL_TYPE.PAYMENT_CONFIRMED, to, subject, html })
}

export async function sendOrderShipped(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = orderShippedEmail(order)
  return sendOrderEmail({ order, emailType: EMAIL_TYPE.ORDER_SHIPPED, to, subject, html })
}

export async function sendOrderCancelled(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = orderCancelledEmail(order)
  return sendOrderEmail({ order, emailType: EMAIL_TYPE.ORDER_CANCELLED, to, subject, html })
}
