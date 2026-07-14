import { ORDER_STATUS } from '@/lib/contracts'
import type { CartItem } from '@/lib/cart'
import { sendOrderReceived } from '@/lib/email/send-order-email'
import { applyPromo } from '@/lib/pricing'
import { getPayloadClient } from '@/lib/payload'
import { generateOrderNumber } from '@/lib/orders/order-number'
import type { Order } from '@/payload-types'

export type CheckoutCustomerInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  pickupNotes?: string
}

export type CreateOrderInput = {
  customer: CheckoutCustomerInput
  items: CartItem[]
}

export type CreateOrderResult =
  | { ok: true; orderNumber: string; orderId: number }
  | { ok: false; error: string }

function lineItemFromCart(item: CartItem) {
  const unitPriceDkk = applyPromo(item.priceDkk, item.promoPercent)
  const lineTotalDkk = Math.round(unitPriceDkk * item.quantity * 100) / 100

  return {
    product: item.productId,
    sku: item.sku,
    productName: item.title,
    unit: item.unit,
    unitPriceDkk,
    quantity: item.quantity,
    lineTotalDkk,
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { customer, items } = input

  if (!items.length) {
    return { ok: false, error: 'empty_cart' }
  }

  const firstName = customer.firstName.trim()
  const lastName = customer.lastName.trim()
  const email = customer.email.trim().toLowerCase()
  const phone = customer.phone.trim()

  if (!firstName || !lastName || !email || !phone) {
    return { ok: false, error: 'missing_fields' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'invalid_email' }
  }

  const lineItems = items.map(lineItemFromCart)
  const subtotalDkk = lineItems.reduce((sum, line) => sum + line.lineTotalDkk, 0)
  const shippingCostDkk = 0
  const totalDkk = subtotalDkk + shippingCostDkk

  try {
    const payload = await getPayloadClient()
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber: generateOrderNumber(),
        status: ORDER_STATUS.AWAITING_CONFIRMATION,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: phone,
        customerEmail: email,
        pickupNotes: customer.pickupNotes?.trim() || undefined,
        shippingMethod: 'pickup',
        lineItems,
        subtotalDkk,
        shippingCostDkk,
        discountDkk: 0,
        totalDkk,
      },
    })

    void sendOrderReceived(order as Order).catch((err) => {
      console.error('[email] order received failed:', err)
    })

    return { ok: true, orderNumber: order.orderNumber, orderId: order.id }
  } catch (err) {
    console.error('createOrder failed:', err)
    return { ok: false, error: 'server_error' }
  }
}
