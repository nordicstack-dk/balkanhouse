import { computeOrderTotals } from '@/lib/orders/order-totals'
import { formatPriceDkk } from '@/lib/pricing'
import type { Order } from '@/payload-types'

import { emailButton, emailLayout, escapeHtml } from './layout'

type OrderLineItem = Order['lineItems'][number]

function customerName(order: Order): string {
  return `${order.customerFirstName} ${order.customerLastName}`.trim()
}

function unitLabel(unit: OrderLineItem['unit']): string {
  return unit === 'kg' ? 'kg' : 'buc'
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

function adjustmentBadge(): string {
  return `
    <span style="display:inline-block;margin-top:4px;padding:2px 8px;background:#fff3e0;color:#b45309;border-radius:4px;font-size:11px;font-weight:600;">
      Ajustat de magazin
    </span>
  `.trim()
}

function quantityCell(item: LineItemForEmail): string {
  const unit = unitLabel(item.unit)
  const current = `${item.quantity} ${unit}`

  if (!isLineAdjusted(item)) {
    return current
  }

  const originalQty = item.originalQuantity
  const hasQtyChange = originalQty != null && originalQty !== item.quantity

  if (!hasQtyChange) {
    return `${current}<br>${adjustmentBadge()}`
  }

  return `
    <span style="text-decoration:line-through;color:#9a8a82;">${originalQty} ${unit}</span><br>
    ${current}<br>
    ${adjustmentBadge()}
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

function adminAdjustmentsNotice(order: Order): string {
  const hasAdjustments =
    order.hasAdminAdjustments === true ||
    normalizedLineItems(order).some((item) => isLineAdjusted(item as LineItemForEmail))

  if (!hasAdjustments) {
    return ''
  }

  return `
    <p style="margin:16px 0 0;padding:12px 16px;background-color:#fff8e6;border-left:4px solid #d97706;border-radius:8px;color:#5c4a42;line-height:1.6;font-size:14px;">
      Cantitate/preț actualizat de magazin pentru unele produse din comandă.
    </p>
  `.trim()
}

function lineItemsTable(order: Order): string {
  const rows = normalizedLineItems(order)
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;">${escapeHtml(item.productName as string)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:center;line-height:1.5;">${quantityCell(item as LineItemForEmail)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:right;line-height:1.5;">${unitPriceCell(item as LineItemForEmail)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8dcc8;text-align:right;">${escapeHtml(formatPriceDkk(item.lineTotalDkk))}</td>
        </tr>
      `,
    )
    .join('')

  return `
    ${adminAdjustmentsNotice(order)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
      <tr>
        <th align="left" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">Produs</th>
        <th align="center" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">Cant.</th>
        <th align="right" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">Preț</th>
        <th align="right" style="padding:8px 0;border-bottom:2px solid #6b1d2a;font-size:12px;text-transform:uppercase;color:#5c4a42;">Total</th>
      </tr>
      ${rows}
      <tr>
        <td colspan="3" style="padding:12px 0 0;font-weight:600;">Total comandă</td>
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
  const subject = `Comanda ${order.orderNumber} a fost primită — Balkan House`

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">Mulțumim, ${escapeHtml(order.customerFirstName)}!</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      Am primit comanda ta și o verificăm. Vei primi un link de plată pe email după confirmare.
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">Număr comandă</p>
    ${orderReference(order)}
    ${lineItemsTable(order)}
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      Ridicare din magazin. Te contactăm dacă avem nevoie de detalii suplimentare.
    </p>
  `

  return { subject, html: emailLayout(content) }
}

export function paymentLinkEmail(order: Order, paymentLinkUrl: string): { subject: string; html: string } {
  const subject = `Link de plată — comanda ${order.orderNumber}`

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">Salut, ${escapeHtml(order.customerFirstName)}!</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      Comanda ta a fost confirmată. Poți plăti acum folosind linkul de mai jos.
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">Număr comandă</p>
    ${orderReference(order)}
    ${lineItemsTable(order)}
    ${emailButton(paymentLinkUrl, 'Plătește acum')}
    <p style="margin:24px 0 0;color:#5c4a42;line-height:1.6;font-size:13px;">
      Dacă butonul nu funcționează, copiază acest link în browser:<br>
      <a href="${escapeHtml(paymentLinkUrl)}" style="color:#6b1d2a;word-break:break-all;">${escapeHtml(paymentLinkUrl)}</a>
    </p>
  `

  return { subject, html: emailLayout(content) }
}

export function paymentConfirmedEmail(order: Order): { subject: string; html: string } {
  const subject = `Plata confirmată — comanda ${order.orderNumber}`

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">Plata a fost primită!</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      Mulțumim, ${escapeHtml(customerName(order))}. Am înregistrat plata pentru comanda ta.
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">Număr comandă</p>
    ${orderReference(order)}
    ${lineItemsTable(order)}
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      Te anunțăm când comanda este pregătită pentru ridicare sau expediere.
    </p>
  `

  return { subject, html: emailLayout(content) }
}

export function orderShippedEmail(order: Order): { subject: string; html: string } {
  const trackingBlock = order.trackingNumber
    ? `<p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;">
         Număr de urmărire: <strong>${escapeHtml(order.trackingNumber)}</strong>
       </p>`
    : ''

  const subject = `Comanda ${order.orderNumber} a fost expediată`

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">Comanda ta este pe drum!</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      Salut, ${escapeHtml(order.customerFirstName)}. Comanda ${escapeHtml(order.orderNumber)} a fost expediată.
    </p>
    ${trackingBlock}
    ${lineItemsTable(order)}
  `

  return { subject, html: emailLayout(content) }
}

export function orderCancelledEmail(order: Order): { subject: string; html: string } {
  const subject = `Comanda ${order.orderNumber} a fost anulată`

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2c1810;">Comandă anulată</h2>
    <p style="margin:0 0 16px;color:#5c4a42;line-height:1.6;">
      Salut, ${escapeHtml(order.customerFirstName)}. Comanda ${escapeHtml(order.orderNumber)} a fost anulată.
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#5c4a42;">Număr comandă</p>
    ${orderReference(order)}
    <p style="margin:16px 0 0;color:#5c4a42;line-height:1.6;font-size:14px;">
      Dacă ai întrebări, răspunde la acest email sau contactează-ne.
    </p>
  `

  return { subject, html: emailLayout(content) }
}
