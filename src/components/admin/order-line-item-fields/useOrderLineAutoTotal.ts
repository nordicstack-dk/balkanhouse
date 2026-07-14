'use client'

import { useAllFormFields, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

import { lineItemRowPath, toFiniteNumber } from '@/lib/orders/line-item-row-path'
import { computeLineTotalDkk } from '@/lib/orders/order-totals'

export function useOrderLineRowPath(fieldPath: string): string {
  return lineItemRowPath(fieldPath)
}

export function useOrderLineAutoTotal(fieldPath: string): {
  rowPath: string
  quantity: unknown
  unitPriceDkk: unknown
  lineTotalDkk: unknown
  lineTotalOverridden: unknown
} {
  const rowPath = useOrderLineRowPath(fieldPath)

  const quantity = useFormFields(([formFields]) => formFields[`${rowPath}.quantity`]?.value)
  const unitPriceDkk = useFormFields(
    ([formFields]) => formFields[`${rowPath}.unitPriceDkk`]?.value,
  )
  const lineTotalDkk = useFormFields(
    ([formFields]) => formFields[`${rowPath}.lineTotalDkk`]?.value,
  )
  const lineTotalOverridden = useFormFields(
    ([formFields]) => formFields[`${rowPath}.lineTotalOverridden`]?.value,
  )

  return { rowPath, quantity, unitPriceDkk, lineTotalDkk, lineTotalOverridden }
}

export function useRecalculateLineTotalOnPriceOrQuantityChange(fieldPath: string): void {
  const [, dispatchFields] = useAllFormFields()
  const { rowPath, quantity, unitPriceDkk } = useOrderLineAutoTotal(fieldPath)
  const previousQuantity = useRef(quantity)
  const previousUnitPrice = useRef(unitPriceDkk)

  useEffect(() => {
    const quantityChanged = previousQuantity.current !== quantity
    const unitPriceChanged = previousUnitPrice.current !== unitPriceDkk

    previousQuantity.current = quantity
    previousUnitPrice.current = unitPriceDkk

    if (!quantityChanged && !unitPriceChanged) {
      return
    }

    const parsedQuantity = toFiniteNumber(quantity)
    const parsedUnitPrice = toFiniteNumber(unitPriceDkk)

    if (parsedQuantity == null || parsedUnitPrice == null) {
      return
    }

    dispatchFields({
      type: 'UPDATE',
      path: `${rowPath}.lineTotalOverridden`,
      value: false,
    })
    dispatchFields({
      type: 'UPDATE',
      path: `${rowPath}.lineTotalDkk`,
      value: computeLineTotalDkk(parsedUnitPrice, parsedQuantity),
    })
  }, [dispatchFields, quantity, rowPath, unitPriceDkk])
}
