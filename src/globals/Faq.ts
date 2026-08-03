import type { GlobalConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Faq: GlobalConfig = {
  slug: 'faq',
  label: 'FAQ',
  admin: {
    group: 'Pages',
    description: 'Frequently asked questions shown on the FAQ page.',
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
      name: 'items',
      type: 'array',
      // Localizing the whole array lets each language have its own set of
      // questions and answers (and a different number of them if needed).
      localized: true,
      labels: {
        singular: 'Question',
        plural: 'Questions',
      },
      admin: {
        description: 'Each entry is shown as an expandable question on the FAQ page.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
