import { SHIPPING_METHOD } from '@/lib/contracts'
import { computeOrderTotals } from '@/lib/orders/order-totals'
import { formatPriceDkk } from '@/lib/pricing'
import type { Order } from '@/payload-types'

import { emailButton, emailLayout, escapeHtml } from './layout'
import { emailMessages, type EmailMessages } from './messages'

type OrderLineItem = Order['lineItems'][number]

function orderLocale(order: Order): string | null | undefined {
  return (order as Order & { locale?: string | null }).locale
}

function messagesFor(order: Order): EmailMessages {
  return emailMessages(orderLocale(order))
}

function layoutFor(order: Order, m: EmailMessages, content: string): string {
  return emailLayout(content, { lang: m.lang, tagline: m.layoutTagline })
}

function customerName(order: Order): string {
  return `${order.customerFirstName} ${order.customerLastName}`.trim()
}

function isDelivery(order: Order): boolean {
  return order.shippingMethod === SHIPPING_METHOD.DELIVERY
}

function shippingMethodLabel(order: Order, m: EmailMessages): string {
  return isDelivery(order) ? m.common.delivery : m.common.pickup
}

/**
 * A "shipping method" block reflecting what the customer actually chose,
 * including the delivery address for home-delivery orders.
 */
function shippingBlock(order: Order, m: EmailMessages): string {
  const addr = order.customerAddress
  const addressLine =
    isDelivery(order) && addr
      ? [
          addr.street,
          [addr.postalCode, addr.city].filter(Boolean).join(' '),
          addr.country,
        ]
          .filter(Boolean)
          .join(', ')
      : ''

  const addressHtml = addressLine
    ? `<br><span style="color:#5c4a42;">${escapeHtml(addressLine)}</span>`
    : ''

  return `
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      <strong>${escapeHtml(m.common.shippingMethod)}:</strong> ${escapeHtml(shippingMethodLabel(order, m))}${addressHtml}
    </p>
  `.trim()
}

function unitLabel(unit: OrderLineItem['unit'], m: EmailMessages): string {
  return unit === 'kg' ? m.common.unitKg : m.common.unitPiece
}

function orderTotalDkk(order: Order): number {
  return computeOrderTotals({
    lineItems: order.lineItems,
    shippingCostDkk: order.shippingCostDkk,
    discountDkk: order.discountDkk,
  }).totalDkk
}

function normalizedLineItems(order: Order) {
  return computeOrderTotals({
    lineItems: order.lineItems,
    shippingCostDkk: order.shippingCostDkk,
    discountDkk: order.discountDkk,
  }).lineItems
}

type LineItemForEmail = Pick<
  OrderLineItem,
  | 'unit'
  | 'quantity'
  | 'unitPriceDkk'
  | 'lineTotalDkk'
  | 'productName'
  | 'adminAdjusted'
  | 'originalQuantity'
  | 'originalUnitPriceDkk'
>

function isLineAdjusted(item: LineItemForEmail): boolean {
  if (item.adminAdjusted) {
    return true
  }

  if (item.originalQuantity != null && item.originalQuantity !== item.quantity) {
    return true
  }

  if (item.originalUnitPriceDkk != null && item.originalUnitPriceDkk !== item.unitPriceDkk) {
    return true
  }

  return false
}

function adjustmentBadge(m: EmailMessages): string {
  return `
    <span style="display:inline-block;margin-top:4px;padding:2px 8px;background:#fff3e0;color:#b45309;border-radius:4px;font-size:11px;font-weight:600;">
      ${escapeHtml(m.common.adjustedBadge)}
    </span>
  `.trim()
}

function quantityCell(item: LineItemForEmail, m: EmailMessages): string {
  const unit = unitLabel(item.unit, m)
  const current = `${item.quantity} ${unit}`

  if (!isLineAdjusted(item)) {
    return current
  }

  const originalQty = item.originalQuantity
  const hasQtyChange = originalQty != null && originalQty !== item.quantity

  if (!hasQtyChange) {
    return `${current}<br>${adjustmentBadge(m)}`
  }

  return `
    <span style="text-decoration:line-through;color:#9a8a82;">${originalQty} ${unit}</span><br>
    ${current}<br>
    ${adjustmentBadge(m)}
  `.trim()
}

function unitPriceCell(item: LineItemForEmail): string {
  const current = formatPriceDkk(item.unitPriceDkk)

  if (!isLineAdjusted(item)) {
    return current
  }

  const originalPrice = item.originalUnitPriceDkk
  const hasPriceChange = originalPrice != null && originalPrice !== item.unitPriceDkk

  if (!hasPriceChange) {
    return current
  }

  return `
    <span style="text-decoration:line-through;color:#9a8a82;">${escapeHtml(formatPriceDkk(originalPrice))}</span><br>
    ${escapeHtml(current)}
  `.trim()
}

function adminAdjustmentsNotice(order: Order, m: EmailMessages): string {
  const hasAdjustments =
    order.hasAdminAdjustments === true ||
    normalizedLineItems(order).some((item) => isLineAdjusted(item as LineItemForEmail))

  if (!hasAdjustments) {
    return ''
  }

  return `
    <p style="margin:16px 0 0;padding:12px 16px;background-color:#fff8e6;border-left:4px solid #d97706;border-radius:8px;color:#5c4a42;line-height:1.6;font-size:14px;">
      ${escapeHtml(m.common.adjustmentsNotice)}
    </p>
  `.trim()
}

function lineItemsTable(order: Order, m: EmailMessages): string {
  const rows = normalizedLineItems(order)
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;">${escapeHtml(item.productName as string)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:center;line-height:1.5;">${quantityCell(item as LineItemForEmail, m)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:right;line-height:1.5;">${unitPriceCell(item as LineItemForEmail)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:right;">${escapeHtml(formatPriceDkk(item.lineTotalDkk))}</td>
        </tr>
      `,
    )
    .join('')

  return `
    ${adminAdjustmentsNotice(order, m)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
      <tr>
        <th align="left" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">${escapeHtml(m.common.tableProduct)}</th>
        <th align="center" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">${escapeHtml(m.common.tableQty)}</th>
        <th align="right" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">${escapeHtml(m.common.tablePrice)}</th>
        <th align="right" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">${escapeHtml(m.common.tableTotal)}</th>
      </tr>
      ${rows}
      <tr>
        <td colspan="3" style="padding:12px 0 0;font-weight:600;">${escapeHtml(m.common.orderTotal)}</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:700;color:#6b1d2a;">${escapeHtml(formatPriceDkk(orderTotalDkk(order)))}</td>
      </tr>
    </table>
  `.trim()
}

function orderReference(order: Order): string {
  return `
    <p style="margin:16px 0;padding:12px 16px;background-color:#f7f0e6;border-radius:8px;font-family:monospace;font-size:14px;">
      ${escapeHtml(order.orderNumber)}
    </p>
  `.trim()
}

export function orderReceivedEmail(order: Order): { subject: string; html: string } {
  const m = messagesFor(order)
  const subject = m.received.subject(order.orderNumber)

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">${m.received.heading(escapeHtml(order.customerFirstName))}</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      ${escapeHtml(m.received.body)}
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">${escapeHtml(m.common.orderNumber)}</p>
    ${orderReference(order)}
    ${lineItemsTable(order, m)}
    ${shippingBlock(order, m)}
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      ${escapeHtml(m.received.followup)}
    </p>
  `

  return { subject, html: layoutFor(order, m, content) }
}

export function paymentLinkEmail(order: Order, paymentLinkUrl: string): { subject: string; html: string } {
  const m = messagesFor(order)
  const subject = m.paymentLink.subject(order.orderNumber)

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">${m.paymentLink.heading(escapeHtml(order.customerFirstName))}</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      ${escapeHtml(m.paymentLink.body)}
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">${escapeHtml(m.common.orderNumber)}</p>
    ${orderReference(order)}
    ${lineItemsTable(order, m)}
    ${shippingBlock(order, m)}
    ${emailButton(paymentLinkUrl, m.paymentLink.button)}
    <p style="margin:24px 0 0;color:#5c4a42;line-height:1.6;font-size:13px;">
      ${escapeHtml(m.paymentLink.fallback)}<br>
      <a href="${escapeHtml(paymentLinkUrl)}" style="color:#6b1d2a;word-break:break-all;">${escapeHtml(paymentLinkUrl)}</a>
    </p>
  `

  return { subject, html: layoutFor(order, m, content) }
}

export function paymentConfirmedEmail(order: Order): { subject: string; html: string } {
  const m = messagesFor(order)
  const subject = m.paymentConfirmed.subject(order.orderNumber)

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">${escapeHtml(m.paymentConfirmed.heading)}</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      ${m.paymentConfirmed.body(escapeHtml(customerName(order)))}
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">${escapeHtml(m.common.orderNumber)}</p>
    ${orderReference(order)}
    ${lineItemsTable(order, m)}
    ${shippingBlock(order, m)}
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      ${escapeHtml(isDelivery(order) ? m.paymentConfirmed.readyDelivery : m.paymentConfirmed.readyPickup)}
    </p>
  `

  return { subject, html: layoutFor(order, m, content) }
}

export function orderShippedEmail(order: Order): { subject: string; html: string } {
  const m = messagesFor(order)
  const delivery = isDelivery(order)

  // Tracking numbers only make sense for delivery orders.
  const trackingBlock =
    delivery && order.trackingNumber
      ? `<p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;">
           ${escapeHtml(m.shipped.tracking)} <strong>${escapeHtml(order.trackingNumber)}</strong>
         </p>`
      : ''

  const subject = delivery
    ? m.shipped.subjectDelivery(order.orderNumber)
    : m.shipped.subjectPickup(order.orderNumber)

  const heading = delivery ? m.shipped.headingDelivery : m.shipped.headingPickup

  const body = delivery
    ? m.shipped.bodyDelivery(escapeHtml(order.customerFirstName), escapeHtml(order.orderNumber))
    : m.shipped.bodyPickup(escapeHtml(order.customerFirstName), escapeHtml(order.orderNumber))

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">${escapeHtml(heading)}</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      ${body}
    </p>
    ${trackingBlock}
    ${lineItemsTable(order, m)}
    ${shippingBlock(order, m)}
  `

  return { subject, html: layoutFor(order, m, content) }
}

export function orderCancelledEmail(order: Order): { subject: string; html: string } {
  const m = messagesFor(order)
  const subject = m.cancelled.subject(order.orderNumber)

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">${escapeHtml(m.cancelled.heading)}</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      ${m.cancelled.body(escapeHtml(order.customerFirstName), escapeHtml(order.orderNumber))}
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">${escapeHtml(m.common.orderNumber)}</p>
    ${orderReference(order)}
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      ${escapeHtml(m.cancelled.followup)}
    </p>
  `

  return { subject, html: layoutFor(order, m, content) }
}
