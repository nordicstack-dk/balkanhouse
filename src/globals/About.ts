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
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Body text. Leave a blank line between paragraphs to split them.',
      },
    },
  ],
}
