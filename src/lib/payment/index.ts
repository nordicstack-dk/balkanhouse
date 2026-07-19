import { createFrisbiiGateway } from './frisbii'
import type { PaymentGateway } from './types'

/**
 * Canonical provider label stored on orders (order.paymentProvider). Kept as
 * 'flatpay' for continuity with existing rows; Frisbii is the underlying gateway
 * (formerly Reepay). Single source of truth — import this everywhere (audit F28).
 */
export const PAYMENT_PROVIDER = 'flatpay'

let gateway: PaymentGateway | null = null

export function getPaymentGateway(): PaymentGateway {
  if (!gateway) {
    gateway = createFrisbiiGateway()
  }
  return gateway
}

export type {
  CancelPaymentSessionResult,
  CreatePaymentLinkParams,
  CreatePaymentLinkResult,
  PaymentGateway,
  PaymentWebhookResult,
  PaymentWebhookStatus,
} from './types'

export { createFrisbiiGateway } from './frisbii'
