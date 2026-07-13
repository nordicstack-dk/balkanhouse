'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { CART_STORAGE_KEY, type CartItem, cartItemCount } from '@/lib/cart'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  hydrated: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) writeCart(items)
  }, [items, hydrated])

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId)
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        }
        return [...prev, { ...item, quantity }]
      })
    },
    [],
  )

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      itemCount: cartItemCount(items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      hydrated,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart, hydrated],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
