import { describe, it, expect } from 'vitest'

import { ORDER_STATUS } from '@/lib/contracts'
import {
  assertOrderFinancialFieldsUnchanged,
  canUpdateOrderFinancialFields,
  isOrderFinanciallyLocked,
} from '@/lib/orders/order-financial-lock'
import type { Order } from '@/payload-types'

const baseOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 1,
    status: ORDER_STATUS.PAID,
    subtotalDkk: 100,
    shippingCostDkk: 0,
    discountDkk: 0,
    totalDkk: 100,
    lineItems: [
      {
        sku: 'A',
        productName: 'Item A',
        unit: 'piece',
        unitPriceDkk: 50,
        quantity: 2,
        lineTotalDkk: 100,
      },
    ],
    ...overrides,
  }) as unknown as Order

describe('isOrderFinanciallyLocked', () => {
  it('locks paid / shipped / cancelled, not awaiting_*', () => {
    expect(isOrderFinanciallyLocked(ORDER_STATUS.PAID)).toBe(true)
    expect(isOrderFinanciallyLocked(ORDER_STATUS.SHIPPED)).toBe(true)
    expect(isOrderFinanciallyLocked(ORDER_STATUS.CANCELLED)).toBe(true)
    expect(isOrderFinanciallyLocked(ORDER_STATUS.AWAITING_PAYMENT)).toBe(false)
    expect(isOrderFinanciallyLocked(ORDER_STATUS.AWAITING_CONFIRMATION)).toBe(false)
    expect(canUpdateOrderFinancialFields({ status: ORDER_STATUS.PAID } as Order)).toBe(false)
    expect(canUpdateOrderFinancialFields({ status: ORDER_STATUS.AWAITING_PAYMENT } as Order)).toBe(
      true,
    )
  })
})

describe('assertOrderFinancialFieldsUnchanged', () => {
  it('throws when a financial scalar changes on a locked order', () => {
    expect(() => assertOrderFinancialFieldsUnchanged({ totalDkk: 90 }, baseOrder())).toThrow()
  })

  it('throws when a line-item price changes on a locked order', () => {
    expect(() =>
      assertOrderFinancialFieldsUnchanged(
        {
          lineItems: [
            {
              sku: 'A',
              productName: 'Item A',
              unit: 'piece',
              unitPriceDkk: 10,
              quantity: 2,
              lineTotalDkk: 20,
            },
          ] as Order['lineItems'],
        },
        baseOrder(),
      ),
    ).toThrow()
  })

  it('allows unchanged financials plus a non-financial edit on a locked order', () => {
    expect(() =>
      assertOrderFinancialFieldsUnchanged({ totalDkk: 100, notes: 'refunded via Frisbii' }, baseOrder()),
    ).not.toThrow()
  })

  it('does nothing when the order is not financially locked', () => {
    expect(() =>
      assertOrderFinancialFieldsUnchanged({ totalDkk: 5 }, baseOrder({ status: ORDER_STATUS.AWAITING_PAYMENT })),
    ).not.toThrow()
  })
})
