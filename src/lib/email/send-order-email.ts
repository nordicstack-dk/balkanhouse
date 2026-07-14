import { getFromEmail, getResendClient } from '@/lib/email/resend'
import {
  orderCancelledEmail,
  orderReceivedEmail,
  orderShippedEmail,
  paymentConfirmedEmail,
  paymentLinkEmail,
} from '@/lib/email/templates/order-emails'
import type { Order } from '@/payload-types'

export type SendOrderEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

async function sendOrderEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendOrderEmailResult> {
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
    })

    if (error) {
      console.error('[email] Resend error:', { to, subject, error })
      return { ok: false, error: error.message }
    }

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
  return sendOrderEmail(to, subject, html)
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
  return sendOrderEmail(to, subject, html)
}

export async function sendPaymentConfirmed(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = paymentConfirmedEmail(order)
  return sendOrderEmail(to, subject, html)
}

export async function sendOrderShipped(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = orderShippedEmail(order)
  return sendOrderEmail(to, subject, html)
}

export async function sendOrderCancelled(order: Order): Promise<SendOrderEmailResult> {
  const to = recipient(order)
  if (!to) {
    return { ok: false, error: 'missing_email' }
  }

  const { subject, html } = orderCancelledEmail(order)
  return sendOrderEmail(to, subject, html)
}
