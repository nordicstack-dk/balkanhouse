import type { CollectionConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Categories: CollectionConfig = {
  slug: 'categories',
  hooks: {
    // Product caches embed category docs, so invalidate those too.
    afterChange: [() => revalidateStorefrontTags('categories', 'products')],
    afterDelete: [() => revalidateStorefrontTags('categories', 'products')],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      localized: true,
      index: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
