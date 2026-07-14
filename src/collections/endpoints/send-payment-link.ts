import { headersWithCors } from 'payload'
import type { PayloadHandler } from 'payload'

import { sendPaymentLink } from '@/lib/orders/send-payment-link'

export const sendPaymentLinkHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: headersWithCors({ headers: new Headers(), req }),
      },
    )
  }

  const id = req.routeParams?.id
  if (!id) {
    return Response.json(
      { error: 'Missing order id' },
      {
        status: 400,
        headers: headersWithCors({ headers: new Headers(), req }),
      },
    )
  }

  const result = await sendPaymentLink(id as string | number)

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: headersWithCors({ headers: new Headers(), req }),
      },
    )
  }

  return Response.json(
    {
      ok: true,
      paymentLinkUrl: result.paymentLinkUrl,
      order: result.order,
      emailSent: result.emailSent,
      emailError: result.emailError,
    },
    {
      status: 200,
      headers: headersWithCors({ headers: new Headers(), req }),
    },
  )
}
