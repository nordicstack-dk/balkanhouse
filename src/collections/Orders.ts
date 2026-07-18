import type { CollectionConfig } from 'payload'

import {
  ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  SHIPPING_METHOD,
  SHIPPING_METHOD_OPTIONS,
  UNIT_OPTIONS,
} from '@/lib/contracts'
import {
  sendOrderCancelled,
  sendOrderShipped,
  sendPaymentConfirmed,
} from '@/lib/email/send-order-email'
import { generateOrderNumber } from '@/lib/orders/order-number'
import { orderHasAdminAdjustments, syncAdminAdjustments } from '@/lib/orders/admin-adjustments'
import {
  assertOrderFinancialFieldsUnchanged,
  canUpdateOrderFinancialFields,
  orderFinancialFieldAccess,
} from '@/lib/orders/order-financial-lock'
import { syncOrderTotalsData } from '@/lib/orders/order-totals'
import { sendPaymentLinkHandler } from '@/collections/endpoints/send-payment-link'
import { cancelPaymentLinkHandler } from '@/collections/endpoints/cancel-payment-link'
import { createLogger } from '@/lib/log'
import type { Order } from '@/payload-types'

const log = createLogger('orders')

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Order',
    plural: 'Orders',
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'customerEmail', 'totalDkk', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customerEmail', 'customerLastName'],
    group: 'Sales',
    description: 'Customer orders. Confirm new orders, send the payment link, then mark as shipped.',
  },
  endpoints: [
    {
      path: '/:id/send-payment-link',
      method: 'post',
      handler: sendPaymentLinkHandler,
    },
    {
      path: '/:id/cancel-payment-link',
      method: 'post',
      handler: cancelPaymentLinkHandler,
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
      name: 'locale',
      type: 'text',
      defaultValue: 'ro',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Shop language the customer ordered in (ro/da/en). Drives email language and the payment-return page.',
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
        description:
          'Paid or shipped orders can be set to Cancelled after you issue a manual refund in Frisbii (Payment tab → Cancel order, or change status here and save).',
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
              access: orderFinancialFieldAccess,
              fields: [
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  access: orderFinancialFieldAccess,
                  admin: {
                    description: 'Reference only — prices are snapshotted below',
                    components: {
                      Field: '@/components/admin/OrderLineProductField#OrderLineProductField',
                    },
                  },
                },
                {
                  name: 'sku',
                  type: 'text',
                  required: true,
                  access: orderFinancialFieldAccess,
                },
                {
                  name: 'productName',
                  type: 'text',
                  required: true,
                  access: orderFinancialFieldAccess,
                },
                {
                  name: 'unit',
                  type: 'select',
                  required: true,
                  options: UNIT_OPTIONS,
                  access: orderFinancialFieldAccess,
                },
                {
                  name: 'unitPriceDkk',
                  type: 'number',
                  required: true,
                  min: 0,
                  access: orderFinancialFieldAccess,
                  admin: {
                    components: {
                      Field: '@/components/admin/order-line-item-fields/OrderLineItemFields#OrderLineUnitPriceField',
                    },
                  },
                },
                {
                  name: 'quantity',
                  type: 'number',
                  required: true,
                  min: 1,
                  access: orderFinancialFieldAccess,
                  admin: {
                    components: {
                      Field: '@/components/admin/order-line-item-fields/OrderLineItemFields#OrderLineQuantityField',
                    },
                  },
                },
                {
                  name: 'lineTotalDkk',
                  type: 'number',
                  required: true,
                  min: 0,
                  access: orderFinancialFieldAccess,
                  admin: {
                    description: 'Auto-calculated from unit price × quantity; editable for custom totals',
                    components: {
                      Field: '@/components/admin/order-line-item-fields/OrderLineItemFields#OrderLineTotalField',
                    },
                  },
                },
                {
                  name: 'originalQuantity',
                  type: 'number',
                  min: 1,
                  admin: {
                    readOnly: true,
                    description: 'Customer-ordered quantity before admin adjustment',
                  },
                },
                {
                  name: 'originalUnitPriceDkk',
                  type: 'number',
                  min: 0,
                  admin: {
                    readOnly: true,
                    description: 'Customer-ordered unit price before admin adjustment',
                  },
                },
                {
                  name: 'lineTotalOverridden',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: 'adminAdjusted',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    readOnly: true,
                    description:
                      'Set when quantity, price, line total, or product was changed by admin',
                  },
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
              type: 'select',
              label: 'Shipping method',
              defaultValue: SHIPPING_METHOD.PICKUP,
              options: SHIPPING_METHOD_OPTIONS,
            },
            {
              name: 'customerAddress',
              type: 'group',
              label: 'Delivery address',
              admin: {
                condition: (data) => data.shippingMethod === SHIPPING_METHOD.DELIVERY,
                description: 'Customer delivery address',
              },
              fields: [
                {
                  name: 'street',
                  type: 'text',
                  label: 'Street',
                },
                {
                  name: 'city',
                  type: 'text',
                  label: 'City',
                },
                {
                  name: 'postalCode',
                  type: 'text',
                  label: 'Postal code',
                },
                {
                  name: 'country',
                  type: 'text',
                  defaultValue: 'DK',
                  admin: {
                    hidden: true,
                  },
                },
              ],
            },
            {
              name: 'pickupNotes',
              type: 'textarea',
              label: 'Pickup notes',
              admin: {
                condition: (data) => data.shippingMethod === SHIPPING_METHOD.PICKUP,
                description: 'Customer notes for pickup (e.g. preferred time)',
              },
            },
            {
              name: 'trackingNumber',
              type: 'text',
              label: 'Tracking number',
              admin: {
                description: 'Optional — add when the order is shipped',
              },
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
              name: 'cancelPaymentLinkAction',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/CancelPaymentLinkButton#CancelPaymentLinkButton',
                },
              },
            },
            {
              name: 'cancelPaidOrderAction',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/CancelPaidOrderButton#CancelPaidOrderButton',
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
              name: 'paymentLinkSentAt',
              type: 'date',
              admin: {
                readOnly: true,
                description: 'When the payment link was last sent to the customer',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
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
            {
              name: 'emailActivity',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/OrderEmailActivity#OrderEmailActivity',
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
      access: orderFinancialFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'shippingCostDkk',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: orderFinancialFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'discountDkk',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: orderFinancialFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'totalDkk',
      type: 'number',
      required: true,
      min: 0,
      access: orderFinancialFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'hasAdminAdjustments',
      type: 'checkbox',
      defaultValue: false,
      access: orderFinancialFieldAccess,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'True when line items were modified after the order was placed',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description:
          'Internal notes (not shown to customer). When cancelling a paid order, include the Frisbii refund reference here.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (operation === 'create' && data && !data.orderNumber) {
          data.orderNumber = generateOrderNumber()
        }

        if (!data) {
          return data
        }

        if (operation === 'update' && originalDoc) {
          assertOrderFinancialFieldsUnchanged(data as Partial<Order>, originalDoc as Order)
        }

        const financiallyLocked =
          operation === 'update' &&
          originalDoc != null &&
          !canUpdateOrderFinancialFields(originalDoc as Order)

        if (financiallyLocked) {
          return data
        }

        if (operation === 'update' && data.lineItems && originalDoc?.lineItems) {
          data.lineItems = syncAdminAdjustments(
            data.lineItems,
            originalDoc.lineItems,
            operation,
          ) as typeof data.lineItems
          data.hasAdminAdjustments = orderHasAdminAdjustments(data.lineItems)
        }

        const shouldRecalculateTotals =
          data.lineItems ||
          data.shippingCostDkk !== undefined ||
          data.discountDkk !== undefined

        if (shouldRecalculateTotals && (data.lineItems || originalDoc?.lineItems)) {
          return syncOrderTotalsData(data, originalDoc as Order | undefined)
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, context }) => {
        if (operation !== 'update' || !previousDoc) {
          return
        }

        const order = doc as Order
        const prevStatus = previousDoc.status
        const nextStatus = order.status

        if (prevStatus === nextStatus) {
          return
        }

        log.info('status changed', {
          orderNumber: order.orderNumber,
          orderId: order.id,
          from: prevStatus,
          to: nextStatus,
        })

        // afterChange runs inside the update's DB transaction, before commit.
        // A caller that must not emit a phantom email if that transaction rolls
        // back (e.g. the long-running expiry cron) sets skipStatusEmail and
        // sends the email itself after the update has committed.
        if (context?.skipStatusEmail) {
          log.info('status email deferred to caller', { orderId: order.id, to: nextStatus })
          return
        }

        // Await the send: this hook runs inside the admin's serverless request,
        // which Vercel freezes once the request returns — a fire-and-forget
        // promise would be killed before the Resend call leaves the instance
        // (same failure mode as the checkout email). Errors are swallowed so a
        // Resend hiccup never fails the status update.
        const send = async (fn: (order: Order) => Promise<unknown>) => {
          try {
            await fn(order)
          } catch (err) {
            log.error('status notification email failed', {
              orderId: order.id,
              to: nextStatus,
              err,
            })
          }
        }

        if (nextStatus === ORDER_STATUS.PAID) {
          await send(sendPaymentConfirmed)
        } else if (nextStatus === ORDER_STATUS.SHIPPED) {
          await send(sendOrderShipped)
        } else if (nextStatus === ORDER_STATUS.CANCELLED) {
          await send(sendOrderCancelled)
        }
      },
    ],
  },
}
