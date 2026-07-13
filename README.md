# Balkan House

E-shop foundation: [Payload CMS](https://payloadcms.com) v3 + [Next.js](https://nextjs.org) + [Neon](https://neon.tech) Postgres.

## Prerequisites

- Node.js 20.9+ (LTS recommended)
- [pnpm](https://pnpm.io) 9+ (`corepack enable` or `npm i -g pnpm`)

## Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
   On Windows (PowerShell): `Copy-Item .env.example .env`

2. In **`.env`** (not `.env.example`), set:
   - `DATABASE_URL` — your Neon Postgres connection string (with `?sslmode=require`)
   - `PAYLOAD_SECRET` — a long random string (32+ characters)
   - `NEXT_PUBLIC_SERVER_URL` — `http://localhost:3000` for local dev

3. Install dependencies and start dev:
   ```bash
   pnpm install
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and create your first admin user at `/admin`.

## Stack notes

- Database: `@payloadcms/db-postgres` (Neon-compatible)
- Locales: Romanian (default), Danish, English
- Collections: Users, Media
