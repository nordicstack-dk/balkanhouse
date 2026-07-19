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

  // On serverless, each concurrent invocation opens its own pool; safety depends
  // on DATABASE_URL pointing at Neon's pooled (`-pooler`) endpoint. Warn loudly
  // in production if it does not, so a direct-endpoint misconfiguration can't
  // silently exhaust Neon connections under load (audit F23).
  if (process.env.NODE_ENV === 'production' && url && !/-pooler\./.test(url)) {
    console.warn(
      '[db] DATABASE_URL does not look like a Neon pooler endpoint (-pooler). ' +
        'Use the pooled connection string on serverless to avoid connection exhaustion.',
    )
  }

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
  // GraphQL is unused (the storefront uses the local API; the admin uses REST),
  // so disable it entirely to remove the endpoint and playground surface (audit F34).
  graphQL: {
    disable: true,
  },
  db: postgresAdapter({
    pool: {
      connectionString: resolveDatabaseUrl(),
      // Serverless-tuned pool: small per-instance cap plus timeouts so a slow
      // gateway or spike can't pile up idle connections (audit F23).
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
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
