/**
 * Tiny structured logger for server-side flows so user actions are traceable in
 * the Vercel function logs. Emits single-line, greppable records:
 *
 *   [checkout] order created {"orderNumber":"BH-2607-0042","orderId":42}
 *
 * - `scope` is the bracketed tag — grep a whole flow with e.g. `[checkout]`.
 * - `data` is serialized to JSON so Vercel shows it inline and it stays
 *   parseable. Vercel already timestamps every line, so we don't add one.
 * - Pass an `err` key holding an Error to `.error(...)`; its stack is printed on
 *   the same record (as console's 2nd arg) so Vercel keeps the full trace.
 *
 * Client components can import this too, but the output only shows in the
 * browser console there — the Vercel debugger only captures server logs.
 */
export type LogData = Record<string, unknown>

export type Logger = {
  info: (message: string, data?: LogData) => void
  warn: (message: string, data?: LogData) => void
  error: (message: string, data?: LogData) => void
}

function safeJson(data: LogData): string {
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

function format(scope: string, message: string, data?: LogData): string {
  if (!data || Object.keys(data).length === 0) {
    return `[${scope}] ${message}`
  }
  return `[${scope}] ${message} ${safeJson(data)}`
}

export function createLogger(scope: string): Logger {
  const emit = (
    fn: (...args: unknown[]) => void,
    message: string,
    data?: LogData,
  ): void => {
    // Peel off an Error passed as `err` so its stack is preserved in the log
    // (JSON.stringify would flatten an Error to `{}`).
    if (data && data.err instanceof Error) {
      const { err, ...rest } = data
      fn(format(scope, message, rest), err)
    } else {
      fn(format(scope, message, data))
    }
  }

  return {
    info: (message, data) => emit(console.log, message, data),
    warn: (message, data) => emit(console.warn, message, data),
    error: (message, data) => emit(console.error, message, data),
  }
}
