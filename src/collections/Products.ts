import type { CollectionConfig } from 'payload'

import {
  ALLERGEN_EU_OPTIONS,
  STOCK_STATUS,
  STOCK_STATUS_OPTIONS,
  UNIT_OPTIONS,
} from '@/lib/contracts'
import {
  imagesFieldHasValues,
  resolveImagesForProductSku,
} from '@/lib/product-image-link'
import { formatProductAdminLabel, resolveLocalizedString } from '@/lib/products/admin-label'
import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Product',
    plural: 'Products',
  },
  admin: {
    useAsTitle: 'adminLabel',
    defaultColumns: ['title', 'sku', 'keyword', 'priceDkk', 'stockStatus', 'category'],
    listSearchableFields: ['sku', 'title', 'adminLabel', 'keyword'],
    group: 'Catalog',
    description: 'Products shown in the shop. Identity, price and stock live in the sidebar; content in the main panel.',
    components: {
      beforeListTable: ['@/components/admin/ProductImportPanel#ProductImportPanel'],
    },
  },
  hooks: {
    // Promotions cache also embeds product docs (depth 2), so invalidate both.
    afterChange: [() => revalidateStorefrontTags('products', 'promotions')],
    afterDelete: [() => revalidateStorefrontTags('products', 'promotions')],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if (!data) {
          return data
        }

        const sku = data.sku ?? originalDoc?.sku
        const title = resolveLocalizedString(
          data.title ?? originalDoc?.title,
          req.locale,
        )
        data.adminLabel = formatProductAdminLabel(sku, title)

        if (typeof data.keyword === 'string') {
          const normalized = data.keyword.trim().toLowerCase()
          data.keyword = normalized || null
        }

        // Empty images → attach Media (or orphan Blob) named after the SKU.
        const incomingImages = data.images !== undefined ? data.images : originalDoc?.images
        if (
          !req.context?.skipSkuImageAutoLink &&
          !imagesFieldHasValues(incomingImages) &&
          typeof sku === 'string' &&
          sku.trim()
        ) {
          try {
            const resolved = await resolveImagesForProductSku(req.payload, sku, {
              alt: title || sku,
              req,
            })
            if (resolved) {
              data.images = resolved
            }
          } catch (error) {
            console.error('[products] SKU image auto-link failed:', error)
          }
        }

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
      admin: {
        position: 'sidebar',
        description: 'Unique product code. Also used in the product URL (/produs/<sku>).',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Product name shown to customers (translate per language).',
      },
    },
    {
      name: 'priceDkk',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Price in DKK, VAT included (e.g. 49.95).',
      },
    },
    {
      name: 'unit',
      type: 'select',
      required: true,
      options: UNIT_OPTIONS,
      admin: {
        position: 'sidebar',
        description: 'Whether the price is per piece or per kilogram.',
      },
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
      admin: {
        description: 'The first image is used as the main product photo.',
      },
    },
    {
      name: 'allergens',
      type: 'select',
      hasMany: true,
      options: ALLERGEN_EU_OPTIONS,
      admin: {
        description: 'EU allergen labels listed on the product page.',
      },
    },
    {
      name: 'ingredients',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Ingredient list shown on the product page (translate per language).',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Full product description (translate per language).',
      },
    },
    {
      name: 'countryOfOrigin',
      type: 'text',
      admin: {
        description: 'Optional ISO country name or code',
      },
    },
    {
      name: 'keyword',
      type: 'text',
      index: true,
      admin: {
        description:
          'Shared keyword for related products on the product page (e.g. bread). Stored lowercase.',
      },
    },
  ],
}
