'use server'

import type { CartItem } from '@/lib/cart'
import {
  createOrder,
  type CheckoutCustomerInput,
  type CreateOrderResult,
} from '@/lib/orders/create-order'

export async function submitCheckout(
  customer: CheckoutCustomerInput,
  items: CartItem[],
  locale?: string,
): Promise<CreateOrderResult> {
  return createOrder({ customer, items, locale })
}
