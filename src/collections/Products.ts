import type { CollectionConfig } from 'payload'

import {
  ALLERGEN_EU_OPTIONS,
  STOCK_STATUS,
  STOCK_STATUS_OPTIONS,
  UNIT_OPTIONS,
} from '@/lib/contracts'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'priceDkk', 'stockStatus', 'category'],
  },
  fields: [
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
