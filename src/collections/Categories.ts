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
    defaultColumns: ['name', 'slug'],
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
      // Not localized: one tile image serves every language, since the artwork
      // carries no text of its own.
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Tile image for "Popular categories" on the home page. A wide crop reads best — about 1600×640. Leave empty to fall back to a plain woven panel.',
      },
    },
  ],
}
