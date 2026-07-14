export interface CreatePaymentLinkParams {
  orderId: string | number
  amountDkk: number
  currency: 'DKK'
  customerEmail: string
  returnUrl: string
}

export interface CreatePaymentLinkResult {
  paymentLinkUrl: string
  paymentReference: string
}

export type PaymentWebhookStatus = 'paid' | 'cancelled' | 'pending'

export interface PaymentWebhookResult {
  orderId: string
  paymentReference: string
  status: PaymentWebhookStatus
  eventId?: string
  eventType?: string
  /** Charge session id from Frisbii (`payment_method_reference`). */
  sessionId?: string
}

export type CancelPaymentSessionResult =
  | { ok: true }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }

export interface PaymentGateway {
  createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult>
  /** Invalidates a checkout session so the payment link can no longer be used. */
  cancelPaymentSession(sessionId: string): Promise<CancelPaymentSessionResult>
  handleWebhook(body: unknown, headers: Record<string, string>): Promise<PaymentWebhookResult>
  getChargeState(orderHandle: string): Promise<string | null>
}
