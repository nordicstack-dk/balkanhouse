import type { CollectionConfig } from 'payload'

import { autoLinkMediaToMatchingProduct } from '@/lib/product-image-link'
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
    afterChange: [
      () => revalidateStorefrontTags('products', 'promotions'),
      async ({ doc, req, context }) => {
        if (context?.skipProductImageAutoLink) return
        try {
          await autoLinkMediaToMatchingProduct(req.payload, doc, { req })
        } catch (error) {
          console.error('[media] Product image auto-link failed:', error)
        }
      },
    ],
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
