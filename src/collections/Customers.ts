import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: {
    singular: 'Customer',
    plural: 'Customers',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'newsletterOptIn'],
    listSearchableFields: ['firstName', 'lastName', 'email', 'phone'],
    group: 'Sales',
    description: 'Guest customer records from checkout, kept for reference and newsletter opt-in.',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'newsletterOptIn',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Customer opted in to the newsletter at checkout (or later).',
      },
    },
    {
      name: 'privacyConsentAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'When the customer last accepted privacy/data processing at checkout.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'address',
      type: 'group',
      // Optional: a customer created from a pickup order has no delivery address
      // (audit F29 — checkout upserts and links a customer by email).
      admin: {
        description: 'Present for delivery orders; empty for pickup customers.',
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
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['orderNumber', 'status', 'totalDkk', 'createdAt'],
        description: 'Orders linked to this customer from checkout.',
      },
      defaultLimit: 20,
      defaultSort: '-createdAt',
    },
  ],
}
