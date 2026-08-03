import { createLogger } from '@/lib/log'

const log = createLogger('after-response')

/**
 * Runs background work *after* the HTTP response is sent.
 *
 * This matters inside Payload collection hooks: Payload commits the operation's
 * DB transaction only after every hook returns, so awaiting slow I/O (e.g. a
 * Resend email send) inside a hook keeps the transaction — and a pooled DB
 * connection plus the row lock — open for the whole call. Under the small
 * serverless connection pool that starves other requests and can make the write
 * time out and roll back (the admin Save spins forever, the change is lost).
 *
 * On Vercel, Next.js `after()` schedules the callback via `waitUntil`, keeping
 * the instance alive after the response so the work still runs (unlike a bare
 * fire-and-forget promise, which the platform would freeze/kill). Outside a
 * request scope (CLI scripts, cron) `after()` is unavailable, so we run inline.
 */
export async function runAfterResponse(
  work: () => Promise<unknown>,
  meta?: Record<string, unknown>,
): Promise<void> {
  const guarded = async () => {
    try {
      await work()
    } catch (err) {
      log.error('background work failed', { ...meta, err })
    }
  }

  try {
    const { after } = await import('next/server')
    after(guarded)
  } catch {
    // No request context (e.g. a direct script/cron call) — run inline so the
    // work is not silently dropped.
    await guarded()
  }
}
