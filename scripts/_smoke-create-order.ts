import 'dotenv/config'

import { createOrder } from '../src/lib/orders/create-order'
import { getPayloadClient } from '../src/lib/payload'

async function main() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'products', limit: 1 })
  const product = docs[0]
  if (!product) {
    console.log('SKIP: no products in database')
    return
  }

  const result = await createOrder({
    customer: {
      firstName: 'Schema',
      lastName: 'Test',
      email: `schema-test+${Date.now()}@example.com`,
      phone: '+4512345678',
      shippingMethod: 'pickup',
      pickupNotes: 'Test pickup note',
    },
    items: [
      {
        productId: product.id,
        sku: product.sku,
        title: 'Schema test',
        unit: product.unit,
        priceDkk: Number(product.priceDkk),
        quantity: 1,
        promoPercent: null,
      },
    ],
  })

  console.log(JSON.stringify(result))
  if (!result.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
