// 8 base36 random chars (~2.8e12 combinations) on top of a millisecond
// timestamp makes an in-same-millisecond collision negligible; createOrder also
// retries on the unique-constraint violation as a backstop (audit F30).
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  )
    .join('')
    .toUpperCase()
  return `BH-${timestamp}-${random}`
}
