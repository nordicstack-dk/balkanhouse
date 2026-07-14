import type { CollectionConfig } from 'payload'

import { ORDER_STATUS, ORDER_STATUS_OPTIONS, UNIT_OPTIONS } from '@/lib/contracts'
import {
  sendOrderCancelled,
  sendOrderShipped,
  sendPaymentConfirmed,
} from '@/lib/email/send-order-email'
import { generateOrderNumber } from '@/lib/orders/order-number'
import { sendPaymentLinkHandler } from '@/collections/endpoints/send-payment-link'
import type { Order } from '@/payload-types'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'customerEmail', 'totalDkk', 'createdAt'],
  },
  endpoints: [
    {
      path: '/:id/send-payment-link',
      method: 'post',
      handler: sendPaymentLinkHandler,
    },
  ],
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: ORDER_STATUS.AWAITING_CONFIRMATION,
      options: ORDER_STATUS_OPTIONS,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Customer',
          fields: [
            {
              name: 'customer',
              type: 'relationship',
              relationTo: 'customers',
              admin: {
                description: 'Optional link to a saved customer record',
              },
            },
            {
              name: 'customerFirstName',
              type: 'text',
              required: true,
            },
            {
              name: 'customerLastName',
              type: 'text',
              required: true,
            },
            {
              name: 'customerPhone',
              type: 'text',
              required: true,
            },
            {
              name: 'customerEmail',
              type: 'email',
              required: true,
            },
            {
              name: 'customerAddress',
              type: 'group',
              admin: {
                description: 'Optional for pickup orders',
              },
              fields: [
                {
                  name: 'street',
                  type: 'text',
                },
                {
                  name: 'city',
                  type: 'text',
                },
                {
                  name: 'postalCode',
                  type: 'text',
                },
                {
                  name: 'country',
                  type: 'text',
                  defaultValue: 'DK',
                },
              ],
            },
            {
              name: 'pickupNotes',
              type: 'textarea',
              admin: {
                description: 'Customer notes for pickup (e.g. preferred time)',
              },
            },
          ],
        },
        {
          label: 'Line items',
          fields: [
            {
              name: 'lineItems',
              type: 'array',
              required: true,
              minRows: 1,
              fields: [
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  admin: {
                    description: 'Reference only — prices are snapshotted below',
                  },
                },
                {
                  name: 'sku',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'productName',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'unit',
                  type: 'select',
                  required: true,
                  options: UNIT_OPTIONS,
                },
                {
                  name: 'unitPriceDkk',
                  type: 'number',
                  required: true,
                  min: 0,
                },
                {
                  name: 'quantity',
                  type: 'number',
                  required: true,
                  min: 1,
                },
                {
                  name: 'lineTotalDkk',
                  type: 'number',
                  required: true,
                  min: 0,
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping',
          fields: [
            {
              name: 'shippingMethod',
              type: 'text',
              defaultValue: 'pickup',
            },
            {
              name: 'trackingNumber',
              type: 'text',
            },
          ],
        },
        {
          label: 'Payment',
          fields: [
            {
              name: 'sendPaymentLinkAction',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/SendPaymentLinkButton#SendPaymentLinkButton',
                },
              },
            },
            {
              name: 'paymentProvider',
              type: 'text',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentReference',
              type: 'text',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paymentLinkUrl',
              type: 'text',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'paidAt',
              type: 'date',
              admin: {
                readOnly: true,
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'subtotalDkk',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'shippingCostDkk',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'discountDkk',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'totalDkk',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not shown to customer)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.orderNumber) {
          data.orderNumber = generateOrderNumber()
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        if (operation !== 'update' || !previousDoc) {
          return
        }

        const order = doc as Order
        const prevStatus = previousDoc.status
        const nextStatus = order.status

        if (prevStatus === nextStatus) {
          return
        }

        const send = (fn: (order: Order) => Promise<unknown>) => {
          void fn(order).catch((err) => {
            console.error('[email] status notification failed:', err)
          })
        }

        if (nextStatus === ORDER_STATUS.PAID) {
          send(sendPaymentConfirmed)
        } else if (nextStatus === ORDER_STATUS.SHIPPED) {
          send(sendOrderShipped)
        } else if (nextStatus === ORDER_STATUS.CANCELLED) {
          send(sendOrderCancelled)
        }
      },
    ],
  },
}
