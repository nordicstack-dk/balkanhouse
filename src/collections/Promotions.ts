import type { CollectionConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Promotions: CollectionConfig = {
  slug: 'promotions',
  labels: {
    singular: 'Promotion',
    plural: 'Promotions',
  },
  hooks: {
    afterChange: [() => revalidateStorefrontTags('promotions')],
    afterDelete: [() => revalidateStorefrontTags('promotions')],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'percentOff', 'startDate', 'endDate'],
    listSearchableFields: ['name'],
    group: 'Catalog',
    description:
      'Time-boxed discounts applied to selected products. A promotion is live between its start and end dates (inclusive).',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal label for this promotion (not shown to customers).',
      },
    },
    {
      name: 'percentOff',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      admin: {
        description: 'Discount percentage applied to the linked products (1–100).',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'First day the promotion is active (inclusive).',
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
        description: 'Last day the promotion is active (inclusive).',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ startDate: unknown }> }) => {
        const start = siblingData?.startDate
        if (value && start && new Date(value as string) < new Date(start as string)) {
          return 'End date must be on or after the start date.'
        }
        return true
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'The products this promotion discounts.',
      },
    },
  ],
}
