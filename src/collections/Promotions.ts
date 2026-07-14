import type { CollectionConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Promotions: CollectionConfig = {
  slug: 'promotions',
  hooks: {
    afterChange: [() => revalidateStorefrontTags('promotions')],
    afterDelete: [() => revalidateStorefrontTags('promotions')],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'percentOff', 'startDate', 'endDate'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal label for this promotion',
      },
    },
    {
      name: 'percentOff',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
  ],
}
