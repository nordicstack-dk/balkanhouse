'use client'

import { RelationshipField, useAllFormFields, useFormFields, useLocale } from '@payloadcms/ui'
import type { RelationshipFieldClientComponent } from 'payload'
import { getSiblingData } from 'payload/shared'
import React, { useEffect, useRef } from 'react'

import { computeLineTotalDkk } from '@/lib/orders/order-totals'
import { isUnsetNumber, lineItemRowPath } from '@/lib/orders/line-item-row-path'
import type { Product } from '@/payload-types'

function resolveProductId(value: unknown): number | null {
  if (value == null) {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }

  return null
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  return false
}

export const OrderLineProductField: RelationshipFieldClientComponent = (props) => {
  const { path } = props
  const [fields, dispatchFields] = useAllFormFields()
  const locale = useLocale()
  const rowPath = lineItemRowPath(path)
  const lastAppliedProductId = useRef<number | null>(null)

  const productValue = useFormFields(([formFields]) => formFields[path]?.value)

  useEffect(() => {
    const productId = resolveProductId(productValue)

    if (productId == null) {
      lastAppliedProductId.current = null
      return
    }

    if (productId === lastAppliedProductId.current) {
      return
    }

    let cancelled = false

    const populateLineItem = async () => {
      const localeCode =
        typeof locale?.code === 'string' && locale.code.trim() !== '' ? locale.code : 'ro'

      try {
        const response = await fetch(
          `/api/products/${productId}?depth=0&locale=${encodeURIComponent(localeCode)}`,
          {
            credentials: 'include',
          },
        )

        if (!response.ok || cancelled) {
          return
        }

        const product = (await response.json()) as Product
        if (cancelled) {
          return
        }

        const siblings = getSiblingData(fields, path) as Record<string, unknown>
        const updates: Array<{ path: string; value: unknown }> = []

        if (isBlank(siblings.productName) && product.title) {
          updates.push({ path: `${rowPath}.productName`, value: product.title })
        }

        if (isBlank(siblings.sku) && product.sku) {
          updates.push({ path: `${rowPath}.sku`, value: product.sku })
        }

        if (isBlank(siblings.unit) && product.unit) {
          updates.push({ path: `${rowPath}.unit`, value: product.unit })
        }

        if (isUnsetNumber(siblings.unitPriceDkk) && product.priceDkk != null) {
          updates.push({ path: `${rowPath}.unitPriceDkk`, value: product.priceDkk })
        }

        const quantity = isUnsetNumber(siblings.quantity) ? 1 : Number(siblings.quantity)
        if (isUnsetNumber(siblings.quantity)) {
          updates.push({ path: `${rowPath}.quantity`, value: 1 })
        }

        const unitPriceDkk = isUnsetNumber(siblings.unitPriceDkk)
          ? product.priceDkk
          : Number(siblings.unitPriceDkk)

        if (
          isUnsetNumber(siblings.lineTotalDkk) &&
          unitPriceDkk != null &&
          Number.isFinite(unitPriceDkk) &&
          Number.isFinite(quantity)
        ) {
          updates.push({
            path: `${rowPath}.lineTotalDkk`,
            value: computeLineTotalDkk(unitPriceDkk, quantity),
          })
        }

        for (const update of updates) {
          dispatchFields({
            type: 'UPDATE',
            path: update.path,
            value: update.value,
          })
        }

        if (!cancelled) {
          lastAppliedProductId.current = productId
        }
      } catch {
        // Leave line fields as-is if product fetch fails.
      }
    }

    void populateLineItem()

    return () => {
      cancelled = true
    }
  }, [dispatchFields, fields, locale?.code, path, productValue, rowPath])

  return <RelationshipField {...props} />
}
