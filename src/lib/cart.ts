export type CartItem = {
  productId: number
  sku: string
  title: string
  quantity: number
  priceDkk: number
  unit: 'piece' | 'kg'
  promoPercent: number | null
}

export const CART_STORAGE_KEY = 'balkanhouse-cart'

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const unitPrice =
      item.promoPercent != null
        ? Math.round(item.priceDkk * (1 - item.promoPercent / 100) * 100) / 100
        : item.priceDkk
    return sum + unitPrice * item.quantity
  }, 0)
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
