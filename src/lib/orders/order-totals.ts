export type OrderLineItemInput = {
  unitPriceDkk?: number | null
  quantity?: number | null
  lineTotalDkk?: number | null
  [key: string]: unknown
}

export function computeLineTotalDkk(unitPriceDkk: number, quantity: number): number {
  return Math.round(unitPriceDkk * quantity * 100) / 100
}

export function normalizeLineItem<T extends OrderLineItemInput>(
  item: T,
): T & { lineTotalDkk: number } {
  const unitPriceDkk = item.unitPriceDkk ?? 0
  const quantity = item.quantity ?? 0

  return {
    ...item,
    lineTotalDkk: computeLineTotalDkk(unitPriceDkk, quantity),
  }
}

export type OrderTotalsInput = {
  lineItems?: OrderLineItemInput[] | null
  shippingCostDkk?: number | null
  discountDkk?: number | null
}

export type OrderTotals = {
  lineItems: Array<OrderLineItemInput & { lineTotalDkk: number }>
  subtotalDkk: number
  totalDkk: number
}

export function computeOrderTotals(input: OrderTotalsInput): OrderTotals {
  const lineItems = (input.lineItems ?? []).map(normalizeLineItem)
  const subtotalDkk =
    Math.round(lineItems.reduce((sum, line) => sum + line.lineTotalDkk, 0) * 100) / 100
  const shippingCostDkk = input.shippingCostDkk ?? 0
  const discountDkk = input.discountDkk ?? 0
  const totalDkk = Math.max(
    0,
    Math.round((subtotalDkk + shippingCostDkk - discountDkk) * 100) / 100,
  )

  return { lineItems, subtotalDkk, totalDkk }
}

type OrderTotalsDoc = {
  lineItems?: OrderLineItemInput[] | null
  shippingCostDkk?: number | null
  discountDkk?: number | null
}

export function syncOrderTotalsData<T extends Record<string, unknown>>(
  data: T,
  originalDoc?: OrderTotalsDoc | null,
): T {
  const lineItems = (data.lineItems ?? originalDoc?.lineItems) as OrderLineItemInput[] | undefined
  if (!lineItems?.length) {
    return data
  }

  const shippingCostDkk = (data.shippingCostDkk ?? originalDoc?.shippingCostDkk ?? 0) as number
  const discountDkk = (data.discountDkk ?? originalDoc?.discountDkk ?? 0) as number
  const totals = computeOrderTotals({ lineItems, shippingCostDkk, discountDkk })

  return {
    ...data,
    lineItems: totals.lineItems,
    subtotalDkk: totals.subtotalDkk,
    totalDkk: totals.totalDkk,
  }
}
