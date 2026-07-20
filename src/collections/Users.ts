import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Admin user',
    plural: 'Admin users',
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
    description: 'Accounts that can sign in to this admin panel.',
  },
  auth: {
    // Default is 2h; extend so an idle admin tab doesn't expire mid-work and
    // start returning 401/403 on every background request. The admin UI also
    // refreshes the token while active, so this mainly covers idle gaps.
    tokenExpiration: 60 * 60 * 8, // 8 hours
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
  versions: false,
}
