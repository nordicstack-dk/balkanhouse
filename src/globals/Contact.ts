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
      type: 'richText',
      localized: true,
      admin: {
        description:
          'Introduction shown under the heading (translate per language). Use the toolbar for headings, bold, lists, links, etc.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      admin: {
        description:
          'Optional free-form content shown below the contact details (translate per language). Format it however you like.',
      },
    },
  ],
}
