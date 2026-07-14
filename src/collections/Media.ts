import type { CollectionConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
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
    },
  ],
  upload: true,
}
