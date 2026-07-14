'use client'

import { NumberField, useAllFormFields } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import React, { useCallback } from 'react'

import {
  useOrderLineAutoTotal,
  useRecalculateLineTotalOnPriceOrQuantityChange,
} from '@/components/admin/order-line-item-fields/useOrderLineAutoTotal'
import { toFiniteNumber } from '@/lib/orders/line-item-row-path'
import { computeLineTotalDkk } from '@/lib/orders/order-totals'

export const OrderLineQuantityField: NumberFieldClientComponent = (props) => {
  useRecalculateLineTotalOnPriceOrQuantityChange(props.path)
  return <NumberField {...props} />
}

export const OrderLineUnitPriceField: NumberFieldClientComponent = (props) => {
  useRecalculateLineTotalOnPriceOrQuantityChange(props.path)
  return <NumberField {...props} />
}

export const OrderLineTotalField: NumberFieldClientComponent = (props) => {
  const [, dispatchFields] = useAllFormFields()
  const { rowPath, quantity, unitPriceDkk } = useOrderLineAutoTotal(props.path)

  const handleChange = useCallback(
    (nextTotal: number) => {
      if (!Number.isFinite(nextTotal)) {
        return
      }

      const parsedQuantity = toFiniteNumber(quantity)
      const parsedUnitPrice = toFiniteNumber(unitPriceDkk)
      const autoTotal =
        parsedQuantity != null && parsedUnitPrice != null
          ? computeLineTotalDkk(parsedUnitPrice, parsedQuantity)
          : null

      const isOverride = autoTotal == null || nextTotal !== autoTotal

      dispatchFields({
        type: 'UPDATE',
        path: `${rowPath}.lineTotalOverridden`,
        value: isOverride,
      })

      if (isOverride) {
        dispatchFields({
          type: 'UPDATE',
          path: `${rowPath}.adminAdjusted`,
          value: true,
        })
      }
    },
    [dispatchFields, quantity, rowPath, unitPriceDkk],
  )

  return <NumberField {...props} onChange={handleChange} />
}
