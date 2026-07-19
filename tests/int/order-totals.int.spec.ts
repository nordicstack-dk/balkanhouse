import { describe, it, expect } from 'vitest'

import {
  computeLineTotalDkk,
  computeOrderTotals,
  normalizeLineItem,
} from '@/lib/orders/order-totals'

describe('computeLineTotalDkk', () => {
  it('multiplies and rounds to 2 decimals', () => {
    expect(computeLineTotalDkk(10, 3)).toBe(30)
    expect(computeLineTotalDkk(19.95, 2)).toBe(39.9)
    expect(computeLineTotalDkk(0.1, 3)).toBe(0.3)
  })
})

describe('computeOrderTotals', () => {
  it('sums line totals into subtotal and total', () => {
    const totals = computeOrderTotals({
      lineItems: [
        { unitPriceDkk: 10, quantity: 2 },
        { unitPriceDkk: 5.5, quantity: 3 },
      ],
      shippingCostDkk: 0,
    })
    expect(totals.subtotalDkk).toBe(36.5)
    expect(totals.totalDkk).toBe(36.5)
  })

  it('adds shipping and subtracts discount, never below zero', () => {
    expect(
      computeOrderTotals({
        lineItems: [{ unitPriceDkk: 10, quantity: 1 }],
        shippingCostDkk: 5,
        discountDkk: 2,
      }).totalDkk,
    ).toBe(13)

    expect(
      computeOrderTotals({
        lineItems: [{ unitPriceDkk: 10, quantity: 1 }],
        discountDkk: 999,
      }).totalDkk,
    ).toBe(0)
  })

  it('honors an explicitly overridden line total', () => {
    const [line] = computeOrderTotals({
      lineItems: [{ unitPriceDkk: 10, quantity: 2, lineTotalDkk: 15, lineTotalOverridden: true }],
    }).lineItems
    expect(line.lineTotalDkk).toBe(15)
  })
})

describe('normalizeLineItem', () => {
  it('recomputes line total from price x quantity by default', () => {
    expect(normalizeLineItem({ unitPriceDkk: 7, quantity: 3 }).lineTotalDkk).toBe(21)
  })

  it('keeps an overridden total instead of recomputing', () => {
    expect(
      normalizeLineItem({ unitPriceDkk: 7, quantity: 3, lineTotalDkk: 20, lineTotalOverridden: true })
        .lineTotalDkk,
    ).toBe(20)
  })
})
