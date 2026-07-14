import { createHmac, timingSafeEqual } from 'node:crypto'

import type {
  CreatePaymentLinkParams,
  CreatePaymentLinkResult,
  PaymentGateway,
  PaymentWebhookResult,
  PaymentWebhookStatus,
} from './types'

const DEFAULT_API_BASE_URL = 'https://api.frisbii.com/v1'
const DEFAULT_CHECKOUT_API_BASE_URL = 'https://checkout-api.frisbii.com/v1'
const PAYMENT_PROVIDER = 'frisbii'

type ChargeSessionResponse = {
  id: string
  url: string
}

type FrisbiiWebhookEvent = {
  id?: string
  timestamp?: string
  signature?: string
  event_type?: string
  event_id?: string
  invoice?: string
  customer?: string
  payment_method_reference?: string
}

export function isSuccessfulChargeState(state: string | null | undefined): boolean {
  if (!state) {
    return false
  }

  const normalized = state.toLowerCase()
  return normalized === 'settled' || normalized === 'authorized'
}

function getApiKey(): string {
  const key = process.env.FLATPAY_API_KEY ?? process.env.FRISBII_API_KEY
  if (!key) {
    throw new Error(
      'Payment API key is not configured. Set FLATPAY_API_KEY (preferred) or FRISBII_API_KEY in .env',
    )
  }
  return key
}

function basicAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
}

function toMinorUnits(amountDkk: number): number {
  return Math.round(amountDkk * 100)
}

function sanitizeHandle(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.\-@]/g, '-').slice(0, 255)
}

export function orderHandleFromId(orderId: string | number): string {
  return sanitizeHandle(String(orderId))
}

function computeWebhookSignature(timestamp: string, id: string, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}${id}`).digest('hex')
}

function signaturesMatch(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)

  if (expectedBuffer.length !== actualBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, actualBuffer)
}

function verifyWebhookSignature(
  event: FrisbiiWebhookEvent,
  headers: Record<string, string>,
  secret: string,
): void {
  const headerSignature =
    headers['x-frisbii-signature'] ??
    headers['X-Frisbii-Signature'] ??
    headers['x-reepay-signature'] ??
    headers['X-Reepay-Signature']

  const timestamp = event.timestamp
  const id = event.id

  if (timestamp && id) {
    const computed = computeWebhookSignature(timestamp, id, secret)
    const provided = event.signature ?? headerSignature
    if (provided && signaturesMatch(computed, provided)) {
      return
    }

    console.error('[frisbii webhook] signature mismatch', {
      eventId: id,
      hasBodySignature: Boolean(event.signature),
      hasHeaderSignature: Boolean(headerSignature),
      hint: 'FLATPAY_WEBHOOK_SECRET must match the Secret key in Frisbii → Configuration → Webhooks',
    })
  } else {
    console.error('[frisbii webhook] signature verification skipped: missing timestamp or id', {
      hasTimestamp: Boolean(timestamp),
      hasId: Boolean(id),
    })
  }

  if (headerSignature && event.signature && signaturesMatch(event.signature, headerSignature)) {
    return
  }

  throw new Error('Invalid Frisbii webhook signature')
}

function resolveWebhookStatus(eventType: string): PaymentWebhookStatus {
  if (
    eventType.includes('settled') ||
    eventType.includes('authorized') ||
    eventType.includes('captured') ||
    eventType.includes('paid')
  ) {
    return 'paid'
  }

  if (
    eventType.includes('failed') ||
    eventType.includes('expired') ||
    eventType.includes('cancelled') ||
    eventType.includes('canceled')
  ) {
    return 'cancelled'
  }

  return 'pending'
}

export class FrisbiiPaymentGateway implements PaymentGateway {
  private readonly apiBaseUrl: string
  private readonly checkoutApiBaseUrl: string

  constructor(
    apiBaseUrl = process.env.FLATPAY_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    checkoutApiBaseUrl =
      process.env.FLATPAY_CHECKOUT_API_BASE_URL ?? DEFAULT_CHECKOUT_API_BASE_URL,
  ) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '')
    this.checkoutApiBaseUrl = checkoutApiBaseUrl.replace(/\/$/, '')
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
    const apiKey = getApiKey()
    const handle = sanitizeHandle(String(params.orderId))
    const customerHandle = sanitizeHandle(params.customerEmail)

    const body = {
      order: {
        handle,
        amount: toMinorUnits(params.amountDkk),
        currency: params.currency,
        customer: {
          email: params.customerEmail,
          handle: customerHandle,
        },
      },
      accept_url: params.returnUrl,
      cancel_url: params.returnUrl,
    }

    const response = await fetch(`${this.checkoutApiBaseUrl}/session/charge`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: basicAuthHeader(apiKey),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Frisbii createPaymentLink failed (${response.status}): ${detail}`)
    }

    const data = (await response.json()) as ChargeSessionResponse

    if (!data.id || !data.url) {
      throw new Error('Frisbii createPaymentLink returned an invalid response')
    }

    return {
      paymentLinkUrl: data.url,
      paymentReference: data.id,
    }
  }

  async handleWebhook(
    body: unknown,
    headers: Record<string, string>,
  ): Promise<PaymentWebhookResult> {
    const webhookSecret = process.env.FLATPAY_WEBHOOK_SECRET
    const event = body as FrisbiiWebhookEvent

    if (webhookSecret) {
      verifyWebhookSignature(event, headers, webhookSecret)
    } else {
      console.warn(
        '[frisbii webhook] FLATPAY_WEBHOOK_SECRET not set — accepting webhook without signature verification',
      )
    }

    const eventType = event.event_type?.toLowerCase() ?? ''
    const orderId = event.invoice ?? ''
    const sessionId = event.payment_method_reference
    const status = resolveWebhookStatus(eventType)

    return {
      orderId,
      paymentReference: sessionId ?? event.invoice ?? '',
      status,
      eventId: event.event_id,
      eventType: event.event_type,
      sessionId,
    }
  }

  /** Verify charge state server-to-server (recommended on return URL). */
  async getChargeState(orderHandle: string): Promise<string | null> {
    const apiKey = getApiKey()
    const handle = sanitizeHandle(orderHandle)

    const response = await fetch(`${this.apiBaseUrl}/charge/${encodeURIComponent(handle)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: basicAuthHeader(apiKey),
      },
    })

    if (!response.ok) {
      console.warn('[frisbii] getChargeState failed', {
        handle,
        status: response.status,
      })
      return null
    }

    const data = (await response.json()) as { state?: string }
    return data.state ?? null
  }
}

export function createFrisbiiGateway(): PaymentGateway {
  return new FrisbiiPaymentGateway()
}

export { PAYMENT_PROVIDER }
