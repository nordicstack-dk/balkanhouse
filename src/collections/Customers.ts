import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: {
    singular: 'Customer',
    plural: 'Customers',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone'],
    listSearchableFields: ['firstName', 'lastName', 'email', 'phone'],
    group: 'Sales',
    description: 'Optional guest customer records, kept for reference.',
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
  ],
}
