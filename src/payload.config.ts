import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { OrderEmails } from './collections/OrderEmails'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Promotions } from './collections/Promotions'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * pg-connection-string warns that sslmode=prefer/require/verify-ca are currently
 * treated as aliases for verify-full, and that pg v9 will change them to weaker
 * libpq semantics. We rely on the current (verify-full) behavior — Neon presents
 * a publicly-trusted cert, so full verification works — so make it explicit.
 * This both silences the warning and locks in today's behavior across the pg
 * upgrade. No-op if the URL has no sslmode or already uses verify-full.
 */
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  return url.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/i, '$1verify-full')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Balkan House',
    },
    components: {
      beforeDashboard: ['@/components/admin/DashboardWelcome#DashboardWelcome'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Products, Promotions, Orders, Customers, OrderEmails],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: resolveDatabaseUrl(),
    },
    push: process.env.PAYLOAD_DISABLE_DB_PUSH !== 'true',
  }),
  sharp,
  localization: {
    locales: ['ro', 'da', 'en'],
    fallback: true,
    defaultLocale: 'ro',
  },
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      access: 'public',
      collections: {
        media: {
          disablePayloadAccessControl: true,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
