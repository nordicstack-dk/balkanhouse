import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const ADMIN_EMAIL = 'admin@balkanhouse.local'
const ADMIN_PASSWORD = 'admin'

async function seedAdminUser(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')

  const payload = await getPayload({ config: await config })

  const existing = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: ADMIN_EMAIL,
      },
    },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: {
        password: ADMIN_PASSWORD,
      },
    })

    console.log(`Admin user already exists — password updated for ${ADMIN_EMAIL}`)
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  })

  console.log(`Admin user created: ${ADMIN_EMAIL}`)
}

seedAdminUser()
  .then(() => {
    console.log('Done. Log in at /admin with:')
    console.log(`  Email:    ${ADMIN_EMAIL}`)
    console.log(`  Password: ${ADMIN_PASSWORD}`)
    process.exit(0)
  })
  .catch((error: unknown) => {
    console.error('Failed to seed admin user:', error)
    process.exit(1)
  })
