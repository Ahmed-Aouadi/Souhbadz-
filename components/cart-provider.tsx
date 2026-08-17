'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type CartLine = {
  id: number
  name: string
  imageUrl: string
  quantity: number
}

export type Pricing = {
  unitPrice: number
  bulkPrice: number
  bulkThreshold: number
}

type CartContextValue = {
  lines: CartLine[]
  totalQuantity: number
  unitPrice: number
  total: number
  pricing: Pricing
  piecesToBulk: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (id: number, quantity: number) => void
  remove: (id: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const MAX_PER_LINE = 1000

export function CartProvider({
  pricing,
  children,
}: {
  pricing: Pricing
  children: React.ReactNode
}) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [open, setOpen] = useState(false)

  const add = useCallback((item: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.id === item.id)
      if (existing) {
        return prev.map((line) =>
          line.id === item.id
            ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_PER_LINE) }
            : line,
        )
      }
      return [...prev, { ...item, quantity: Math.min(quantity, MAX_PER_LINE) }]
    })
    setOpen(true)
  }, [])

  const setQuantity = useCallback((id: number, quantity: number) => {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.id !== id) return [line]
        const next = Math.min(Math.max(Math.round(quantity) || 0, 0), MAX_PER_LINE)
        return next === 0 ? [] : [{ ...line, quantity: next }]
      }),
    )
  }, [])

  const remove = useCallback((id: number) => {
    setLines((prev) => prev.filter((line) => line.id !== id))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
    const unitPrice = totalQuantity >= pricing.bulkThreshold ? pricing.bulkPrice : pricing.unitPrice
    return {
      lines,
      totalQuantity,
      unitPrice,
      total: totalQuantity * unitPrice,
      pricing,
      piecesToBulk: Math.max(pricing.bulkThreshold - totalQuantity, 0),
      open,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
    }
  }, [lines, open, pricing, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
