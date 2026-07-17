import { EMAIL_STATUS, type EmailStatus, type EmailType } from '@/lib/contracts'
import type { Payload } from 'payload'
import type { OrderEmail } from '@/payload-types'

/**
 * Resend webhook event (only the fields we use). Tags may arrive as an array of
 * `{ name, value }` (the send-time shape) or as a plain object map, depending on
 * Resend's payload version — parseTags handles both.
 */
type ResendTags = Array<{ name?: string; value?: string }> | Record<string, string> | null | undefined

export type ResendWebhookEvent = {
  type?: string
  created_at?: string
  data?: {
    email_id?: string
    to?: string | string[]
    subject?: string
    created_at?: string
    tags?: ResendTags
    bounce?: { message?: string } | null
  }
}

/** Progress statuses in lifecycle order; higher rank = further along. */
const PROGRESS_RANK: Partial<Record<EmailStatus, number>> = {
  [EMAIL_STATUS.SENT]: 1,
  [EMAIL_STATUS.DELIVERED]: 2,
  [EMAIL_STATUS.OPENED]: 3,
  [EMAIL_STATUS.CLICKED]: 4,
}

type EmailUpdate = Partial<
  Pick<
    OrderEmail,
    | 'status'
    | 'deliveredAt'
    | 'openedAt'
    | 'clickedAt'
    | 'bouncedAt'
    | 'lastEventAt'
    | 'lastError'
  >
>

export function parseTags(tags: ResendTags): { orderId?: string; emailType?: string } {
  if (!tags) {
    return {}
  }
  const map: Record<string, string> = {}
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (t?.name) {
        map[t.name] = t.value ?? ''
      }
    }
  } else {
    Object.assign(map, tags)
  }
  return { orderId: map.order_id, emailType: map.email_type }
}

/**
 * Given the current row status and a Resend event type, compute the fields to
 * write. Progress events (delivered/opened/clicked) only advance the status
 * forward; failure events (bounced/complained/failed) always take over. Returns
 * null for event types we don't track.
 */
export function computeEmailUpdate(
  currentStatus: EmailStatus | null | undefined,
  eventType: string,
  at: string,
  errorMessage?: string,
): EmailUpdate | null {
  const base: EmailUpdate = { lastEventAt: at }

  switch (eventType) {
    case 'email.delivered':
      return { ...base, deliveredAt: at, status: advance(currentStatus, EMAIL_STATUS.DELIVERED) }
    case 'email.opened':
      return { ...base, openedAt: at, status: advance(currentStatus, EMAIL_STATUS.OPENED) }
    case 'email.clicked':
      return { ...base, clickedAt: at, status: advance(currentStatus, EMAIL_STATUS.CLICKED) }
    case 'email.bounced':
      return { ...base, bouncedAt: at, status: EMAIL_STATUS.BOUNCED, lastError: errorMessage }
    case 'email.complained':
      return { ...base, status: EMAIL_STATUS.COMPLAINED, lastError: errorMessage }
    case 'email.failed':
      return { ...base, status: EMAIL_STATUS.FAILED, lastError: errorMessage }
    default:
      // email.sent, email.scheduled, email.delivery_delayed, etc. — not tracked.
      return null
  }
}

/** Advance a progress status forward only; leave failure statuses untouched. */
function advance(current: EmailStatus | null | undefined, next: EmailStatus): EmailStatus {
  if (!current) {
    return next
  }
  const currentRank = PROGRESS_RANK[current]
  const nextRank = PROGRESS_RANK[next]
  if (currentRank === undefined || nextRank === undefined) {
    // current is a failure status (or unknown) — don't downgrade it.
    return current
  }
  return nextRank > currentRank ? next : current
}

export type ApplyEmailWebhookOutcome = {
  applied: boolean
  reason?: string
  orderEmailId?: number
}

export async function applyEmailWebhook(
  payload: Payload,
  event: ResendWebhookEvent,
): Promise<ApplyEmailWebhookOutcome> {
  const eventType = event.type ?? ''
  const resendId = event.data?.email_id?.trim()
  const at = event.created_at ?? event.data?.created_at ?? new Date().toISOString()
  const errorMessage = event.data?.bounce?.message

  const update = computeEmailUpdate(undefined, eventType, at, errorMessage)
  if (!update) {
    return { applied: false, reason: 'untracked_event' }
  }

  if (!resendId) {
    return { applied: false, reason: 'missing_email_id' }
  }

  const existing = await payload.find({
    collection: 'order-emails',
    where: { resendId: { equals: resendId } },
    limit: 1,
  })

  const row = existing.docs[0] as OrderEmail | undefined

  if (row) {
    const forwardUpdate = computeEmailUpdate(row.status as EmailStatus, eventType, at, errorMessage)
    if (!forwardUpdate) {
      return { applied: false, reason: 'untracked_event' }
    }
    const updated = await payload.update({
      collection: 'order-emails',
      id: row.id,
      data: forwardUpdate,
    })
    return { applied: true, orderEmailId: (updated as OrderEmail).id }
  }

  // No row yet (event beat the send-time write). Recreate from tags.
  const { orderId, emailType } = parseTags(event.data?.tags)
  const orderIdNum = orderId ? Number.parseInt(orderId, 10) : NaN
  if (!Number.isFinite(orderIdNum) || !emailType) {
    return { applied: false, reason: 'order_not_found' }
  }

  const to = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to
  const created = await payload.create({
    collection: 'order-emails',
    data: {
      order: orderIdNum,
      emailType: emailType as EmailType,
      resendId,
      to,
      subject: event.data?.subject,
      ...update,
      status: update.status ?? EMAIL_STATUS.SENT,
    },
  })
  return { applied: true, orderEmailId: (created as OrderEmail).id }
}
