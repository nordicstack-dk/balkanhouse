import { ORDER_STATUS, SHIPPING_METHOD, STOCK_STATUS, type ShippingMethod } from '@/lib/contracts'
import type { CartItem } from '@/lib/cart'
import { sendOrderReceived } from '@/lib/email/send-order-email'
import { applyPromo } from '@/lib/pricing'
import { getPayloadClient } from '@/lib/payload'
import { generateOrderNumber } from '@/lib/orders/order-number'
import { computeLineTotalDkk, computeOrderTotals } from '@/lib/orders/order-totals'
import { getActivePromotions } from '@/lib/storefront'
import { getPromoPercentForProduct } from '@/lib/promotions'
import type { Order } from '@/payload-types'

export type CustomerAddressInput = {
  street: string
  city: string
  postalCode: string
}

const DELIVERY_COUNTRY = 'DK'

export type CheckoutCustomerInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  shippingMethod: ShippingMethod
  address?: CustomerAddressInput
  pickupNotes?: string
}

export type CreateOrderInput = {
  customer: CheckoutCustomerInput
  items: CartItem[]
}

export type CreateOrderResult =
  | { ok: true; orderNumber: string; orderId: number }
  | { ok: false; error: string }

/**
 * Rebuilds line items from the database instead of trusting the client cart.
 * The cart is only used for product identity and quantity; price, promotion,
 * unit and SKU are re-read at order time so expired promotions and tampered
 * localStorage values never reach an order. Returns null if any product no
 * longer exists or is out of stock.
 */
async function buildVerifiedLineItems(items: CartItem[]) {
  const payload = await getPayloadClient()
  const ids = items.map((item) => item.productId)

  const [productsResult, promotions] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 0,
    }),
    getActivePromotions(),
  ])
  const productsById = new Map(productsResult.docs.map((p) => [p.id, p]))

  const lineItems = []
  for (const item of items) {
    const product = productsById.get(item.productId)
    if (!product || product.stockStatus === STOCK_STATUS.OUT) {
      return null
    }

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
    const promoPercent = getPromoPercentForProduct(product.id, promotions)
    const unitPriceDkk = applyPromo(product.priceDkk, promoPercent)

    lineItems.push({
      product: product.id,
      sku: product.sku,
      productName: item.title || product.title,
      unit: product.unit,
      unitPriceDkk,
      quantity,
      lineTotalDkk: computeLineTotalDkk(unitPriceDkk, quantity),
    })
  }
  return lineItems
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

  const shippingMethod = customer.shippingMethod
  if (shippingMethod !== SHIPPING_METHOD.PICKUP && shippingMethod !== SHIPPING_METHOD.DELIVERY) {
    return { ok: false, error: 'missing_fields' }
  }

  let customerAddress:
    | (CustomerAddressInput & {
        country: string
      })
    | undefined
  if (shippingMethod === SHIPPING_METHOD.DELIVERY) {
    const street = customer.address?.street.trim() ?? ''
    const city = customer.address?.city.trim() ?? ''
    const postalCode = customer.address?.postalCode.trim() ?? ''

    if (!street || !city || !postalCode) {
      return { ok: false, error: 'missing_address' }
    }

    customerAddress = { street, city, postalCode, country: DELIVERY_COUNTRY }
  }

  try {
    const lineItems = await buildVerifiedLineItems(items)
    if (!lineItems) {
      return { ok: false, error: 'unavailable_products' }
    }

    const shippingCostDkk = 0
    const { subtotalDkk, totalDkk } = computeOrderTotals({ lineItems, shippingCostDkk })

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
        pickupNotes:
          shippingMethod === SHIPPING_METHOD.PICKUP
            ? customer.pickupNotes?.trim() || undefined
            : undefined,
        customerAddress,
        shippingMethod,
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
