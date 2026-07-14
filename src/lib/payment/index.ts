import { createFrisbiiGateway } from './frisbii'
import type { PaymentGateway } from './types'

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

export { createFrisbiiGateway, PAYMENT_PROVIDER } from './frisbii'
