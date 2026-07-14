import { headersWithCors } from 'payload'
import type { PayloadHandler } from 'payload'

import { cancelPaymentLink } from '@/lib/orders/cancel-payment-link'

export const cancelPaymentLinkHandler: PayloadHandler = async (req) => {
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

  const result = await cancelPaymentLink(id as string | number)

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
      order: result.order,
      sessionCancelled: result.sessionCancelled,
      sessionNotFound: result.sessionNotFound,
    },
    {
      status: 200,
      headers: headersWithCors({ headers: new Headers(), req }),
    },
  )
}
