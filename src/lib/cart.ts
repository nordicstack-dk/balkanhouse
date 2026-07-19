import { applyPromo } from '@/lib/pricing'

export type CartItem = {
  productId: number
  sku: string
  title: string
  quantity: number
  priceDkk: number
  unit: 'piece' | 'kg'
  promoPercent: number | null
  /** Snapshot of the product's primary image at add-to-cart time; optional for carts saved before this field existed. */
  imageUrl?: string | null
}

export const CART_STORAGE_KEY = 'balkanhouse-cart'

export function cartSubtotal(items: CartItem[]): number {
  // Single source of truth for promo pricing so the cart total can never drift
  // from the checkout summary and the created order (audit F27).
  return items.reduce((sum, item) => {
    return sum + applyPromo(item.priceDkk, item.promoPercent) * item.quantity
  }, 0)
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}
