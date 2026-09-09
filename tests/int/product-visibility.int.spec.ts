import { describe, it, expect } from 'vitest'

import { hasUnitPriceLine } from '@/components/products/UnitPriceLine'
import { STOCK_STATUS, UNIT } from '@/lib/contracts'
import { getPromotedProducts } from '@/lib/promotions'
import type { Product, Promotion } from '@/payload-types'

function product(overrides: Partial<Product>): Product {
  return {
    id: 1,
    sku: 'BH-001',
    title: 'Test',
    priceDkk: 10,
    unit: UNIT.PIECE,
    stockStatus: STOCK_STATUS.IN,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Product
}

function promotion(products: Product[]): Promotion {
  return {
    id: 1,
    percentOff: 20,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    products,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as Promotion
}

describe('hasUnitPriceLine', () => {
  it('shows a per-kg line for a prepacked product with a weight', () => {
    expect(hasUnitPriceLine({ unit: UNIT.PIECE, netWeightGrams: 200, netVolumeMl: null })).toBe(true)
  })

  it('shows a per-litre line for a product with a volume', () => {
    expect(hasUnitPriceLine({ unit: UNIT.PIECE, netWeightGrams: null, netVolumeMl: 1500 })).toBe(true)
  })

  it('hides for a kg-priced product, whose headline price is already per kg', () => {
    expect(hasUnitPriceLine({ unit: UNIT.KG, netWeightGrams: 1000, netVolumeMl: null })).toBe(false)
    expect(hasUnitPriceLine({ unit: UNIT.KG, netWeightGrams: null, netVolumeMl: null })).toBe(false)
  })

  it('hides when neither content field is set', () => {
    expect(hasUnitPriceLine({ unit: UNIT.PIECE, netWeightGrams: null, netVolumeMl: null })).toBe(false)
    expect(hasUnitPriceLine({ unit: UNIT.PIECE, netWeightGrams: 0, netVolumeMl: 0 })).toBe(false)
  })
})

describe('getPromotedProducts', () => {
  it('keeps published products and dedupes across overlapping promotions', () => {
    const a = product({ id: 1, sku: 'A' })
    const b = product({ id: 2, sku: 'B' })
    const result = getPromotedProducts([promotion([a, b]), promotion([b])])
    expect(result.map((p) => p.sku)).toEqual(['A', 'B'])
  })

  it('drops products with no stock status, which reach it via a nested relation', () => {
    const visible = product({ id: 1, sku: 'A' })
    const hidden = product({ id: 2, sku: 'B', stockStatus: null })
    const result = getPromotedProducts([promotion([visible, hidden])])
    expect(result.map((p) => p.sku)).toEqual(['A'])
  })

  it('keeps out-of-stock products, which are published but sold out', () => {
    const soldOut = product({ id: 1, sku: 'A', stockStatus: STOCK_STATUS.OUT })
    expect(getPromotedProducts([promotion([soldOut])])).toHaveLength(1)
  })
})
