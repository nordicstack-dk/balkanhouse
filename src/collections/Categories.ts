import type { CollectionConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  hooks: {
    // Product caches embed category docs, so invalidate those too.
    afterChange: [() => revalidateStorefrontTags('categories', 'products')],
    afterDelete: [() => revalidateStorefrontTags('categories', 'products')],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent'],
    listSearchableFields: ['name', 'slug'],
    group: 'Catalog',
    description: 'Shop categories used for browsing and filtering products.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Category name shown in the shop (translate per language).',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      localized: true,
      index: true,
      admin: {
        description: "URL segment, e.g. 'conserve' becomes /shop/conserve (translate per language).",
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Optional parent category, for nesting.',
      },
    },
  ],
}
