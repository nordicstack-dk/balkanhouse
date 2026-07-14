import type { CollectionConfig } from 'payload'

import {
  ALLERGEN_EU_OPTIONS,
  STOCK_STATUS,
  STOCK_STATUS_OPTIONS,
  UNIT_OPTIONS,
} from '@/lib/contracts'
import { formatProductAdminLabel, resolveLocalizedString } from '@/lib/products/admin-label'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'adminLabel',
    defaultColumns: ['title', 'sku', 'priceDkk', 'stockStatus', 'category'],
    listSearchableFields: ['sku', 'title', 'adminLabel'],
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        if (!data) {
          return data
        }

        const sku = data.sku ?? originalDoc?.sku
        const title = resolveLocalizedString(
          data.title ?? originalDoc?.title,
          req.locale,
        )
        data.adminLabel = formatProductAdminLabel(sku, title)

        return data
      },
    ],
    beforeRead: [
      ({ doc, req }) => {
        if (!doc || req.context?.skipAdminLabelReadFix) {
          return doc
        }

        const computed = formatProductAdminLabel(
          doc.sku,
          resolveLocalizedString(doc.title, req.locale),
        )
        const currentLabel = typeof doc.adminLabel === 'string' ? doc.adminLabel.trim() : ''

        if (computed && currentLabel !== computed) {
          doc.adminLabel = computed
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'adminLabel',
      type: 'text',
      localized: true,
      index: true,
      admin: {
        hidden: true,
        readOnly: true,
        description: 'Auto-generated "SKU — Title" for admin search and labels',
      },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'priceDkk',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in DKK (e.g. 49.95)',
      },
    },
    {
      name: 'unit',
      type: 'select',
      required: true,
      options: UNIT_OPTIONS,
    },
    {
      name: 'stockStatus',
      type: 'select',
      required: true,
      defaultValue: STOCK_STATUS.IN,
      options: STOCK_STATUS_OPTIONS,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'allergens',
      type: 'select',
      hasMany: true,
      options: ALLERGEN_EU_OPTIONS,
    },
    {
      name: 'ingredients',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'countryOfOrigin',
      type: 'text',
      admin: {
        description: 'Optional ISO country name or code',
      },
    },
    {
      name: 'attributes',
      type: 'json',
      admin: {
        description: 'Optional extra product attributes (key/value)',
      },
    },
  ],
}
