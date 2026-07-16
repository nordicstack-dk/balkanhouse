import type { CollectionConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media file',
    plural: 'Media',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    listSearchableFields: ['filename', 'alt'],
    group: 'Catalog',
    description: 'Images used across the shop. Product photos can be uploaded here or directly from a product.',
  },
  hooks: {
    // Product and promotion caches embed media docs (image URLs).
    afterChange: [() => revalidateStorefrontTags('products', 'promotions')],
    afterDelete: [() => revalidateStorefrontTags('products', 'promotions')],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describes the image for screen readers and SEO. Required.',
      },
    },
  ],
  upload: true,
}
