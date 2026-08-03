import type { GlobalConfig } from 'payload'

import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Site-wide contact details used in the footer, contact page, and anywhere the shop shows its own email or phone.',
  },
  hooks: {
    afterChange: [() => revalidateStorefrontTags('pages')],
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      defaultValue: 'contact@balkanhouse.dk',
      admin: {
        description: 'Public support email address (shared across all languages).',
      },
    },
    {
      name: 'phone',
      type: 'text',
      defaultValue: '+45 00 00 00 00',
      admin: {
        description: 'Public support phone number (shared across all languages).',
      },
    },
  ],
}
