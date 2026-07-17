import type { CollectionConfig } from 'payload'

import { EMAIL_STATUS_OPTIONS, EMAIL_TYPE_OPTIONS } from '@/lib/contracts'

/**
 * One row per order email dispatched through Resend. Created when the email is
 * sent (status = sent) and advanced by the Resend webhook as delivery events
 * arrive (delivered → opened → clicked, or bounced/complained/failed).
 *
 * Hidden from the admin nav — surfaced only via the "Email activity" panel on
 * the order page. Rows are written server-side via the local API, never edited
 * by hand in the admin UI.
 */
export const OrderEmails: CollectionConfig = {
  slug: 'order-emails',
  labels: {
    singular: 'Order email',
    plural: 'Order emails',
  },
  admin: {
    useAsTitle: 'subject',
    group: 'Sales',
    hidden: true,
    defaultColumns: ['emailType', 'to', 'status', 'sentAt'],
    description: 'Delivery status of order emails, tracked from Resend webhooks.',
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      index: true,
    },
    {
      name: 'emailType',
      type: 'select',
      required: true,
      options: EMAIL_TYPE_OPTIONS,
    },
    {
      name: 'resendId',
      type: 'text',
      index: true,
      admin: {
        description: 'Resend email id; used to match incoming webhook events.',
      },
    },
    {
      name: 'to',
      type: 'text',
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: EMAIL_STATUS_OPTIONS,
    },
    { name: 'sentAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'deliveredAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'openedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'clickedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'bouncedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'lastEventAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'lastError',
      type: 'text',
      admin: {
        description: 'Latest bounce/failure detail reported by Resend, if any.',
      },
    },
  ],
}
