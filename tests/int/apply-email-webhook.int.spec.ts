import { describe, it, expect } from 'vitest'

import { EMAIL_STATUS } from '@/lib/contracts'
import { computeEmailUpdate, parseTags } from '@/lib/orders/apply-email-webhook'

const AT = '2026-07-17T10:00:00.000Z'

describe('computeEmailUpdate', () => {
  it('maps delivered/opened/clicked to their status + timestamp', () => {
    expect(computeEmailUpdate(EMAIL_STATUS.SENT, 'email.delivered', AT)).toMatchObject({
      status: EMAIL_STATUS.DELIVERED,
      deliveredAt: AT,
      lastEventAt: AT,
    })
    expect(computeEmailUpdate(EMAIL_STATUS.DELIVERED, 'email.opened', AT)).toMatchObject({
      status: EMAIL_STATUS.OPENED,
      openedAt: AT,
    })
    expect(computeEmailUpdate(EMAIL_STATUS.OPENED, 'email.clicked', AT)).toMatchObject({
      status: EMAIL_STATUS.CLICKED,
      clickedAt: AT,
    })
  })

  it('advances status forward only — never downgrades', () => {
    // clicked already reached; a later "delivered" must not roll status back
    const update = computeEmailUpdate(EMAIL_STATUS.CLICKED, 'email.delivered', AT)
    expect(update?.status).toBe(EMAIL_STATUS.CLICKED)
    // but the delivered timestamp is still recorded
    expect(update?.deliveredAt).toBe(AT)
  })

  it('records the specific timestamp even when status does not change', () => {
    const update = computeEmailUpdate(EMAIL_STATUS.OPENED, 'email.delivered', AT)
    expect(update?.status).toBe(EMAIL_STATUS.OPENED)
    expect(update?.deliveredAt).toBe(AT)
  })

  it('lets failure events take over and captures the error', () => {
    expect(computeEmailUpdate(EMAIL_STATUS.DELIVERED, 'email.bounced', AT, 'mailbox full')).toMatchObject({
      status: EMAIL_STATUS.BOUNCED,
      bouncedAt: AT,
      lastError: 'mailbox full',
    })
    expect(computeEmailUpdate(EMAIL_STATUS.SENT, 'email.complained', AT)).toMatchObject({
      status: EMAIL_STATUS.COMPLAINED,
    })
    expect(computeEmailUpdate(EMAIL_STATUS.SENT, 'email.failed', AT)).toMatchObject({
      status: EMAIL_STATUS.FAILED,
    })
  })

  it('does not downgrade a failure status back to a progress status', () => {
    const update = computeEmailUpdate(EMAIL_STATUS.BOUNCED, 'email.opened', AT)
    expect(update?.status).toBe(EMAIL_STATUS.BOUNCED)
    expect(update?.openedAt).toBe(AT)
  })

  it('returns null for untracked event types', () => {
    expect(computeEmailUpdate(EMAIL_STATUS.SENT, 'email.sent', AT)).toBeNull()
    expect(computeEmailUpdate(EMAIL_STATUS.SENT, 'email.delivery_delayed', AT)).toBeNull()
    expect(computeEmailUpdate(EMAIL_STATUS.SENT, 'contact.created', AT)).toBeNull()
  })
})

describe('parseTags', () => {
  it('parses the array-of-{name,value} shape', () => {
    expect(
      parseTags([
        { name: 'order_id', value: '42' },
        { name: 'email_type', value: 'order_received' },
      ]),
    ).toEqual({ orderId: '42', emailType: 'order_received' })
  })

  it('parses the object-map shape', () => {
    expect(parseTags({ order_id: '7', email_type: 'payment_link' })).toEqual({
      orderId: '7',
      emailType: 'payment_link',
    })
  })

  it('returns empty object for missing/null tags', () => {
    expect(parseTags(null)).toEqual({})
    expect(parseTags(undefined)).toEqual({})
  })
})
