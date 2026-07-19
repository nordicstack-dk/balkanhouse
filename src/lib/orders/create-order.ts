import { after } from 'next/server'

import { ORDER_STATUS, SHIPPING_METHOD, STOCK_STATUS, type ShippingMethod } from '@/lib/contracts'
import type { CartItem } from '@/lib/cart'
import { sendOrderReceived } from '@/lib/email/send-order-email'
import { createLogger, maskEmail } from '@/lib/log'
import { applyPromo } from '@/lib/pricing'
import { getPayloadClient } from '@/lib/payload'
import { generateOrderNumber } from '@/lib/orders/order-number'
import { computeLineTotalDkk, computeOrderTotals } from '@/lib/orders/order-totals'
import { getActivePromotions } from '@/lib/storefront'
import { getPromoPercentForProduct } from '@/lib/promotions'
import { routing } from '@/i18n/routing'
import type { Payload } from 'payload'
import type { Customer, Order } from '@/payload-types'

const log = createLogger('checkout')

const ROUTING_LOCALES: readonly string[] = routing.locales
const DEFAULT_LOCALE: string = routing.defaultLocale

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
  /** Shop language the customer ordered in; stored on the order for emails + payment return. */
  locale?: string
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

/**
 * Find-or-create a customer by email and return its id, so orders roll up to a
 * customer record (audit F29). Address is optional (pickup customers have none).
 * The caller treats this as best-effort — a failure must never lose the order.
 */
async function upsertCustomer(
  payload: Payload,
  data: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: (CustomerAddressInput & { country: string }) | undefined
  },
): Promise<number> {
  // payload-types is regenerated out-of-band (payload generate:types). Customers
  // address is optional at runtime (see Customers.ts) but the current generated
  // type still marks it required, so bridge with a cast until types are regenerated.
  const fields = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    ...(data.address ? { address: data.address } : {}),
  } as unknown as Customer

  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: data.email } },
    limit: 1,
    depth: 0,
  })

  const current = existing.docs[0]
  if (current) {
    await payload.update({ collection: 'customers', id: current.id, data: fields })
    return current.id
  }

  const created = await payload.create({ collection: 'customers', data: fields })
  return created.id
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { customer, items } = input
  const locale = ROUTING_LOCALES.includes(input.locale as string)
    ? (input.locale as string)
    : DEFAULT_LOCALE

  log.info('order requested', {
    itemCount: items.length,
    shippingMethod: customer?.shippingMethod,
    locale,
  })

  if (!items.length) {
    log.warn('order rejected', { reason: 'empty_cart' })
    return { ok: false, error: 'empty_cart' }
  }

  const firstName = customer.firstName.trim()
  const lastName = customer.lastName.trim()
  const email = customer.email.trim().toLowerCase()
  const phone = customer.phone.trim()

  if (!firstName || !lastName || !email || !phone) {
    log.warn('order rejected', { reason: 'missing_fields' })
    return { ok: false, error: 'missing_fields' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    log.warn('order rejected', { reason: 'invalid_email', email: maskEmail(email) })
    return { ok: false, error: 'invalid_email' }
  }

  const shippingMethod = customer.shippingMethod
  if (shippingMethod !== SHIPPING_METHOD.PICKUP && shippingMethod !== SHIPPING_METHOD.DELIVERY) {
    log.warn('order rejected', { reason: 'missing_fields', shippingMethod })
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
      log.warn('order rejected', { reason: 'missing_address' })
      return { ok: false, error: 'missing_address' }
    }

    customerAddress = { street, city, postalCode, country: DELIVERY_COUNTRY }
  }

  try {
    const lineItems = await buildVerifiedLineItems(items)
    if (!lineItems) {
      log.warn('order rejected', { reason: 'unavailable_products', email: maskEmail(email) })
      return { ok: false, error: 'unavailable_products' }
    }

    const shippingCostDkk = 0
    const { subtotalDkk, totalDkk } = computeOrderTotals({ lineItems, shippingCostDkk })

    const payload = await getPayloadClient()

    // Best-effort customer link (audit F29): never fails checkout — the order
    // keeps its own snapshot fields regardless of whether the customer write works.
    let customerId: number | undefined
    try {
      customerId = await upsertCustomer(payload, {
        firstName,
        lastName,
        email,
        phone,
        address: customerAddress,
      })
    } catch (err) {
      log.warn('customer upsert failed; order continues unlinked', {
        email: maskEmail(email),
        err,
      })
    }

    const baseData = {
      status: ORDER_STATUS.AWAITING_CONFIRMATION,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerPhone: phone,
      customerEmail: email,
      ...(customerId ? { customer: customerId } : {}),
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
      locale,
    }

    // Bounded retry (audit F30): a same-millisecond order-number collision on the
    // unique index surfaces as a create error; regenerating the number and
    // retrying turns a rare transient failure into a success. A non-collision
    // error simply fails again and falls through to the server_error handler.
    let created: Order | null = null
    let lastCreateErr: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        created = (await payload.create({
          collection: 'orders',
          data: { orderNumber: generateOrderNumber(), ...baseData },
        })) as Order
        break
      } catch (err) {
        lastCreateErr = err
        log.warn('order create attempt failed; retrying with a new number', {
          attempt,
          email: maskEmail(email),
        })
      }
    }
    if (!created) {
      throw lastCreateErr ?? new Error('order create failed')
    }
    const order = created

    log.info('order created', {
      orderNumber: order.orderNumber,
      orderId: order.id,
      email: maskEmail(email),
      shippingMethod,
      itemCount: lineItems.length,
      totalDkk,
    })

    // Send the confirmation email after the HTTP response is flushed. On Vercel
    // the serverless function is frozen the moment this action returns, which
    // kills a bare fire-and-forget promise before the Resend request ever leaves
    // the instance (the email silently never sends — works locally because the
    // Node process persists). after() registers the work with the runtime's
    // waitUntil so the function stays alive for it, without slowing checkout.
    const dispatchOrderEmail = () => {
      log.info('dispatching order-received email', {
        orderNumber: order.orderNumber,
        orderId: order.id,
        email: maskEmail(email),
      })
      return sendOrderReceived(order).catch((err) => {
        log.error('order-received email failed', { orderId: order.id, email: maskEmail(email), err })
      })
    }
    try {
      after(dispatchOrderEmail)
    } catch {
      // Not inside a request scope (e.g. the smoke-test script) — send inline.
      void dispatchOrderEmail()
    }

    return { ok: true, orderNumber: order.orderNumber, orderId: order.id }
  } catch (err) {
    log.error('order creation failed', { email: maskEmail(email), err })
    return { ok: false, error: 'server_error' }
  }
}
