'use client'

import { useCart } from '@/components/cart-provider'
import type { Product } from '@/lib/db/schema'
import { Check, Plus, Search } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

export function ProductGrid({ products }: { products: Product[] }) {
  const { add, lines, unitPrice } = useCart()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category).filter(Boolean))
    return ['all', ...Array.from(unique)]
  }, [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [products, query, category])

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground bg-card border-border rounded-xl border p-8 text-center text-sm">
        لا توجد منتجات معروضة حالياً. أضف منتجاتك من لوحة التحكم.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن تصميم..."
            aria-label="ابحث عن تصميم"
            className="border-input bg-card focus:border-accent focus:ring-ring/30 w-full rounded-lg border py-2 pr-10 pl-4 text-sm outline-none focus:ring-2"
          />
        </div>
        {categories.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  category === item
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                }`}
              >
                {item === 'all' ? 'الكل' : item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((product) => {
          const inCart = lines.find((line) => line.id === product.id)
          return (
            <article
              key={product.id}
              className="bg-card border-border flex flex-col overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md"
            >
              <div className="bg-secondary relative h-48">
                <Image
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex grow flex-col gap-3 p-4">
                {product.category && (
                  <span className="bg-accent/20 text-accent-foreground w-fit rounded-full px-2 py-1 text-xs font-bold">
                    {product.category}
                  </span>
                )}
                <h3 className="text-pretty text-base font-bold leading-6">{product.name}</h3>
                {product.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed">{product.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="font-black">{product.price ?? unitPrice} دج</span>
                  <button
                    type="button"
                    onClick={() =>
                      add({ id: product.id, name: product.name, imageUrl: product.imageUrl })
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition"
                  >
                    {inCart ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    )}
                    {inCart ? `في السلة (${inCart.quantity})` : 'أضف للسلة'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">لا توجد نتائج مطابقة للبحث.</p>
      )}
    </div>
  )
}
