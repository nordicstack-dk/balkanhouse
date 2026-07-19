import { timingSafeEqual } from 'node:crypto'

import { expirePaymentLinks } from '@/lib/orders/expire-payment-links'

// Give the cron room to drain a backlog without the platform killing it
// mid-batch; expirePaymentLinks also self-limits to a time budget (audit F21).
export const maxDuration = 60

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return false
  }

  const auth = request.headers.get('authorization')?.trim() ?? ''
  // Constant-time comparison (audit F10).
  return safeEqual(auth, `Bearer ${secret}`)
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    console.error('[expire-payment-links] CRON_SECRET is not configured')
    return Response.json({ error: 'Cron not configured' }, { status: 503 })
  }

  if (!verifyCronAuth(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expirePaymentLinks()
    return Response.json({
      expired: result.expired,
      orderNumbers: result.orderNumbers,
      ...(result.skipped.length > 0 ? { skipped: result.skipped } : {}),
    })
  } catch (err) {
    console.error('[expire-payment-links] cron failed', err)
    return Response.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
