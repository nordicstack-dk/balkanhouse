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

export interface PaymentWebhookResult {
  orderId: string | number
  paymentReference: string
  paid: boolean
}

export interface PaymentGateway {
  createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult>
  handleWebhook(body: unknown, headers: Record<string, string>): Promise<PaymentWebhookResult>
}
