'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartLine = {
  key: string
  productId: number
  variantId?: number
  name: string
  imageUrl: string
  quantity: number
  unitPrice?: number
  options?: { color?: string; size?: string }
  maxStock?: number
  custom?: boolean
}

export type Pricing = {
  unitPrice: number
  bulkPrice: number
  bulkThreshold: number
}

type CartContextValue = {
  lines: CartLine[]
  totalQuantity: number
  total: number
  pricing: Pricing
  piecesToBulk: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const MAX_PER_LINE = 1000

function isLine(value: unknown): value is CartLine {
  const x = value as Partial<CartLine>
  return !!x && typeof x === 'object' && typeof x.key === 'string' && Number.isInteger(x.productId) &&
    typeof x.name === 'string' && typeof x.imageUrl === 'string' && Number.isFinite(x.quantity)
}

export function CartProvider({ pricing, children }: { pricing: Pricing; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('souhbadz-cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setLines(parsed.filter(isLine))
      }
    } catch {
      localStorage.removeItem('souhbadz-cart')
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem('souhbadz-cart', JSON.stringify(lines)) } catch {}
  }, [lines, hydrated])

  const [open, setOpen] = useState(false)

  const add = useCallback((item: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.key === item.key)
      const requested = Math.max(1, Math.round(quantity) || 1)
      if (existing) {
        const cap = existing.maxStock ? Math.min(existing.maxStock, MAX_PER_LINE) : MAX_PER_LINE
        return prev.map((line) => line.key === item.key
          ? { ...line, ...item, quantity: Math.min(line.quantity + requested, cap) }
          : line)
      }
      const cap = item.maxStock ? Math.min(item.maxStock, MAX_PER_LINE) : MAX_PER_LINE
      return [...prev, { ...item, quantity: Math.min(requested, cap) }]
    })
    setOpen(true)
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) => prev.flatMap((line) => {
      if (line.key !== key) return [line]
      const cap = line.maxStock ? Math.min(line.maxStock, MAX_PER_LINE) : MAX_PER_LINE
      const next = Math.min(Math.max(Math.round(quantity) || 0, 0), cap)
      return next === 0 ? [] : [{ ...line, quantity: next }]
    }))
  }, [])

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((line) => line.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)
    const total = lines.reduce((sum, line) => {
      const price = line.unitPrice ?? (totalQuantity >= pricing.bulkThreshold ? pricing.bulkPrice : pricing.unitPrice)
      return sum + price * line.quantity
    }, 0)
    return {
      lines, totalQuantity, total, pricing,
      piecesToBulk: Math.max(pricing.bulkThreshold - totalQuantity, 0),
      open, setOpen, add, setQuantity, remove, clear,
    }
  }, [lines, open, pricing, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
