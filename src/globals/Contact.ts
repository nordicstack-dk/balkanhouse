import type { GlobalConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Contact',
  admin: {
    group: 'Pages',
    description: 'Content for the Contact page.',
  },
  hooks: {
    afterChange: [() => revalidateStorefrontTags('pages')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Page heading (translate per language).',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short introduction shown under the heading (translate per language).',
      },
    },
    {
      name: 'email',
      type: 'text',
      admin: {
        description: 'Contact email address (shared across languages).',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Contact phone number (shared across languages).',
      },
    },
  ],
}
