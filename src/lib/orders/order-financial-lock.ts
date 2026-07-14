import type { FieldAccess } from 'payload'
import { ValidationError } from 'payload'

import { ORDER_STATUS, type OrderStatus } from '@/lib/contracts'
import type { Order } from '@/payload-types'

export const FINANCIALLY_LOCKED_ORDER_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.CANCELLED,
] as const satisfies readonly OrderStatus[]

export type FinanciallyLockedOrderStatus = (typeof FINANCIALLY_LOCKED_ORDER_STATUSES)[number]

const CANCELLABLE_ORDER_STATUSES = [ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED] as const

const FINANCIAL_SCALAR_FIELDS = [
  'subtotalDkk',
  'shippingCostDkk',
  'discountDkk',
  'totalDkk',
  'hasAdminAdjustments',
] as const

type OrderLineItem = NonNullable<Order['lineItems']>[number]

type LineItemFinancialSnapshot = {
  sku: string
  productName: string
  unit: string
  unitPriceDkk: number
  quantity: number
  lineTotalDkk: number
  productId: number | null
}

export function isOrderFinanciallyLocked(status: OrderStatus | null | undefined): boolean {
  return (
    status != null &&
    FINANCIALLY_LOCKED_ORDER_STATUSES.includes(status as FinanciallyLockedOrderStatus)
  )
}

export function canUpdateOrderFinancialFields(doc?: Pick<Order, 'status'> | null): boolean {
  return !isOrderFinanciallyLocked(doc?.status)
}

export function isOrderCancellationTransition(
  data: Partial<Order>,
  originalDoc: Order,
): boolean {
  return (
    data.status === ORDER_STATUS.CANCELLED &&
    originalDoc.status !== ORDER_STATUS.CANCELLED &&
    CANCELLABLE_ORDER_STATUSES.includes(
      originalDoc.status as (typeof CANCELLABLE_ORDER_STATUSES)[number],
    )
  )
}

export const orderFinancialFieldAccess: { update: FieldAccess<Order> } = {
  update: ({ doc }) => canUpdateOrderFinancialFields(doc),
}

function normalizeProductId(product: OrderLineItem['product']): number | null {
  if (product == null) {
    return null
  }

  if (typeof product === 'number') {
    return product
  }

  if (typeof product === 'object' && 'id' in product && typeof product.id === 'number') {
    return product.id
  }

  return null
}

function normalizeLineItemFinancial(item: OrderLineItem): LineItemFinancialSnapshot {
  return {
    sku: String(item.sku ?? ''),
    productName: String(item.productName ?? ''),
    unit: String(item.unit ?? ''),
    unitPriceDkk: Number(item.unitPriceDkk ?? 0),
    quantity: Number(item.quantity ?? 0),
    lineTotalDkk: Number(item.lineTotalDkk ?? 0),
    productId: normalizeProductId(item.product),
  }
}

function lineItemsFinanciallyEqual(
  nextLineItems: Order['lineItems'] | undefined | null,
  originalLineItems: Order['lineItems'] | undefined | null,
): boolean {
  const next = (nextLineItems ?? []).map(normalizeLineItemFinancial)
  const original = (originalLineItems ?? []).map(normalizeLineItemFinancial)

  if (next.length !== original.length) {
    return false
  }

  return next.every((item, index) => {
    const other = original[index]
    return (
      item.sku === other.sku &&
      item.productName === other.productName &&
      item.unit === other.unit &&
      item.unitPriceDkk === other.unitPriceDkk &&
      item.quantity === other.quantity &&
      item.lineTotalDkk === other.lineTotalDkk &&
      item.productId === other.productId
    )
  })
}

function financialScalarEqual(
  field: (typeof FINANCIAL_SCALAR_FIELDS)[number],
  nextValue: unknown,
  originalValue: unknown,
): boolean {
  if (field === 'hasAdminAdjustments') {
    return Boolean(nextValue) === Boolean(originalValue)
  }

  return Number(nextValue ?? 0) === Number(originalValue ?? 0)
}

function getChangedFinancialFields(data: Partial<Order>, originalDoc: Order): string[] {
  const changed: string[] = []

  if (
    data.lineItems !== undefined &&
    !lineItemsFinanciallyEqual(data.lineItems, originalDoc.lineItems)
  ) {
    changed.push('lineItems')
  }

  for (const field of FINANCIAL_SCALAR_FIELDS) {
    if (
      data[field] !== undefined &&
      !financialScalarEqual(field, data[field], originalDoc[field])
    ) {
      changed.push(field)
    }
  }

  return changed
}

export function assertOrderFinancialFieldsUnchanged(
  data: Partial<Order> | undefined,
  originalDoc: Order | undefined,
): void {
  if (!data || !originalDoc || !isOrderFinanciallyLocked(originalDoc.status)) {
    return
  }

  const changedFields = getChangedFinancialFields(data, originalDoc)
  if (changedFields.length === 0) {
    return
  }

  throw new ValidationError({
    collection: 'orders',
    errors: changedFields.map((path) => ({
      path,
      message:
        'Financial fields cannot be changed after the order has been paid, shipped, or cancelled.',
    })),
  })
}
