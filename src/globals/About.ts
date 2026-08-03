import type { GlobalConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'About (Despre)',
  admin: {
    group: 'Pages',
    description: 'Content for the "Despre" (About us) page.',
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
      name: 'content',
      type: 'richText',
      localized: true,
      admin: {
        description:
          'Full page content (translate per language). Use the toolbar for headings, bold, lists, links, etc.',
      },
    },
  ],
}
