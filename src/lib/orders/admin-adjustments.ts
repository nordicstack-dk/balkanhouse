export type OrderLineItemWithAdjustments = {
  id?: string | null
  sku?: string | null
  productName?: string | null
  unitPriceDkk?: number | null
  quantity?: number | null
  originalQuantity?: number | null
  originalUnitPriceDkk?: number | null
  adminAdjusted?: boolean | null
  [key: string]: unknown
}

function findPreviousLine(
  previous: OrderLineItemWithAdjustments[],
  current: OrderLineItemWithAdjustments,
  index: number,
): OrderLineItemWithAdjustments | undefined {
  if (current.id) {
    const byId = previous.find((line) => line.id === current.id)
    if (byId) {
      return byId
    }
  }

  if (current.sku) {
    const bySku = previous.find((line) => line.sku === current.sku)
    if (bySku) {
      return bySku
    }
  }

  return previous[index]
}

function lineWasAdjusted(
  current: OrderLineItemWithAdjustments,
  previous?: OrderLineItemWithAdjustments,
): boolean {
  if (!previous) {
    return true
  }

  return (
    current.quantity !== previous.quantity ||
    current.unitPriceDkk !== previous.unitPriceDkk ||
    current.sku !== previous.sku ||
    current.productName !== previous.productName
  )
}

export function syncAdminAdjustments<T extends OrderLineItemWithAdjustments>(
  incomingLineItems: T[] | undefined | null,
  previousLineItems: OrderLineItemWithAdjustments[] | undefined | null,
  operation: 'create' | 'update',
): T[] | undefined | null {
  if (!incomingLineItems?.length || operation !== 'update' || !previousLineItems?.length) {
    return incomingLineItems
  }

  return incomingLineItems.map((line, index) => {
    const previous = findPreviousLine(previousLineItems, line, index)

    if (!lineWasAdjusted(line, previous)) {
      return line
    }

    return {
      ...line,
      adminAdjusted: true,
      originalQuantity: line.originalQuantity ?? previous?.quantity ?? undefined,
      originalUnitPriceDkk: line.originalUnitPriceDkk ?? previous?.unitPriceDkk ?? undefined,
    }
  })
}

export function orderHasAdminAdjustments(
  lineItems: OrderLineItemWithAdjustments[] | undefined | null,
): boolean {
  return (lineItems ?? []).some((line) => line.adminAdjusted === true)
}
