# Expire payment links — cron-job.org setup

Balkan House auto-cancels orders that have been in **Awaiting payment** longer than `PAYMENT_LINK_EXPIRY_HOURS` (default **72 hours**). The job calls Frisbii to cancel the checkout session, marks the order **Cancelled**, and clears payment link fields.

Use [cron-job.org](https://cron-job.org) (free external scheduler). **Do not** use Vercel Cron on the Hobby plan.

## 1. Generate a secret

Create a long random string for `CRON_SECRET`, for example:

```bash
openssl rand -base64 32
```

On Windows PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 2. Add environment variables on Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `CRON_SECRET` | Your generated secret | Production (and Preview if you test there) |
| `PAYMENT_LINK_EXPIRY_HOURS` | `72` (optional; this is the default) | Production |

Redeploy after saving so the API route can read the new variables.

## 3. Create a cron-job.org account

1. Go to [https://cron-job.org](https://cron-job.org) and sign up (free tier is enough).
2. Confirm your email if prompted.
3. Open the dashboard.

## 4. Create the cron job

1. Click **Create cronjob** (or **CREATE CRONJOB**).
2. **Title:** `Balkan House — expire payment links` (any label you like).
3. **URL:**

   ```
   https://YOUR_DOMAIN/api/cron/expire-payment-links
   ```

   Replace `YOUR_DOMAIN` with your production host, e.g. `balkanhouse.vercel.app` or your custom domain.

4. **Schedule** — pick one:
   - **Every 6 hours** (recommended): custom cron `0 */6 * * *`
   - **Daily at 03:00 UTC**: `0 3 * * *`

5. **Request method:** `GET` (POST also works).

6. **Headers** — add one custom header:

   | Header | Value |
   |--------|-------|
   | `Authorization` | `Bearer YOUR_CRON_SECRET` |

   Use the exact same value as `CRON_SECRET` on Vercel (including the `Bearer ` prefix).

7. Leave other options at defaults unless you need notifications on failure.
8. Save the cron job.

## 5. Test manually

Before relying on the schedule, run the job once from cron-job.org (**Run now**) or call the endpoint yourself:

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://YOUR_DOMAIN/api/cron/expire-payment-links"
```

Expected success response:

```json
{
  "expired": 0,
  "orderNumbers": []
}
```

If there are stale orders, `expired` is the count and `orderNumbers` lists which orders were cancelled.

**Error responses:**

| Status | Meaning |
|--------|---------|
| `401` | Wrong or missing `Authorization` header |
| `503` | `CRON_SECRET` not set on the server |
| `500` | Unexpected server error — check Vercel function logs |

## 6. What the job does

For each order with status **awaiting_payment** where the payment link was sent more than `PAYMENT_LINK_EXPIRY_HOURS` ago:

1. Uses `paymentLinkSentAt` when set; otherwise falls back to `updatedAt`.
2. Calls Frisbii `cancelPaymentSession` when `paymentReference` exists (404 = already gone).
3. Sets status to **cancelled** and clears `paymentLinkUrl`, `paymentReference`, and `paymentLinkSentAt`.
4. Triggers the existing cancelled-order email hook.

Orders that fail session cancellation are skipped and listed under `skipped` in the JSON response.

## 7. Local development

Add to `.env.local`:

```env
CRON_SECRET=dev-cron-secret
PAYMENT_LINK_EXPIRY_HOURS=72
```

Then:

```bash
curl -s -H "Authorization: Bearer dev-cron-secret" \
  "http://localhost:3000/api/cron/expire-payment-links"
```
