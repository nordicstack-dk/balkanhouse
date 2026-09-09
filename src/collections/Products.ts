import type { CollectionConfig } from 'payload'

import {
  ALLERGEN_EU_OPTIONS,
  STOCK_STATUS_OPTIONS,
  UNIT,
  UNIT_OPTIONS,
} from '@/lib/contracts'
import {
  imagesFieldHasValues,
  resolveImagesForProductSku,
} from '@/lib/product-image-link'
import { formatProductAdminLabel, resolveLocalizedString } from '@/lib/products/admin-label'
import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

/**
 * A pack size on a kg-priced product is always a data-entry mistake, and an
 * expensive one: `priceDkk` is the price of one kilogram there, so entering a
 * 1500 g pack's price as if it were per-kg undercharges by a third. Fail loudly
 * instead — the product should be `piece` with the pack price.
 */
function rejectContentOnKgProducts(value: unknown, options: unknown): true | string {
  if (value == null) return true
  const unit = (options as { siblingData?: { unit?: string } })?.siblingData?.unit
  if (unit === UNIT.KG) {
    return 'Leave this empty for kg-priced products: the price above is already per kg. For a fixed-weight pack, set Unit to "Piece" and enter the pack price.'
  }
  return true
}

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
      name: 'netWeightGrams',
      type: 'number',
      min: 1,
      admin: {
        position: 'sidebar',
        description:
          'Net weight of one pack, in grams (e.g. 200). Only shows the customer a reference price per kg — the price above is still what is charged. Leave empty for kg-priced products and anything not sold by weight.',
      },
      validate: rejectContentOnKgProducts,
    },
    {
      name: 'netVolumeMl',
      type: 'number',
      min: 1,
      admin: {
        position: 'sidebar',
        description:
          'Net volume of one pack, in millilitres (e.g. 1500 for 1.5 L). Shows a reference price per litre. Use this instead of net weight for drinks, oil and vinegar — for solids in brine, use the drained weight above.',
      },
      validate: (value: unknown, options: unknown) => {
        const onKg = rejectContentOnKgProducts(value, options)
        if (onKg !== true) return onKg
        const sibling = (options as { siblingData?: { netWeightGrams?: number | null } })
          ?.siblingData
        if (value != null && sibling?.netWeightGrams != null) {
          return 'Fill in either net weight or net volume, not both — a product is sold by one or the other.'
        }
        return true
      },
    },
    {
      // No default and not required: an empty status is the "not published"
      // state, so a half-filled import row stays invisible instead of silently
      // going on sale. Every storefront query filters on it (see PUBLISHED in
      // src/lib/storefront.ts).
      name: 'stockStatus',
      type: 'select',
      options: STOCK_STATUS_OPTIONS,
      admin: {
        position: 'sidebar',
        description:
          'Leave empty to hide the product from the storefront entirely — not listed, not searchable, cannot be ordered. Pick a value to publish it ("Epuizat" still shows, marked sold out).',
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
