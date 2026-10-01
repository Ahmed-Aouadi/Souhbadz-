'use client'

import { useCart } from '@/components/cart-provider'
import type { ProductVariant } from '@/lib/db/schema'
import type { StoreProduct } from '@/lib/queries'
import { Check, ChevronLeft, Plus, Search, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

function variantLabel(v: ProductVariant) {
  return [v.color, v.size].filter(Boolean).join(' • ') || 'الخيار الأساسي'
}

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  const { add, lines, pricing } = useCart()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<StoreProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const categoryOk = category === 'all' || p.category === category
      const queryOk = !q || [p.name, p.description, p.category].join(' ').toLowerCase().includes(q)
      return categoryOk && queryOk
    })
  }, [products, query, category])

  function openProduct(product: StoreProduct) {
    setSelected(product)
    setSelectedVariant(product.inventoryEnabled ? (product.variants.find((v) => v.stock > 0) ?? product.variants[0] ?? null) : null)
  }

  function addProduct(product: StoreProduct, variant = selectedVariant) {
    const key = `${product.id}:${variant?.id ?? 0}`
    const maxStock = product.inventoryEnabled ? (variant?.stock ?? 0) : undefined
    if (product.inventoryEnabled && (!variant || maxStock === 0)) return
    add({
      key,
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: variant?.price ?? product.price ?? undefined,
      options: variant ? { color: variant.color || undefined, size: variant.size || undefined } : undefined,
      maxStock,
    })
    setSelected(null)
  }

  if (!products.length) {
    return <p className="bg-card border-border rounded-2xl border p-8 text-center text-sm">لا توجد منتجات معروضة حالياً.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-[69px] z-20 -mx-4 bg-background/95 px-4 pb-2 pt-1 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${category === item ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border-border border text-foreground'}`}>
              {item === 'all' ? 'الكل' : item}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <Search className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن منتج..." aria-label="ابحث عن منتج"
            className="bg-card border-border w-full rounded-xl border py-3 pr-10 pl-4 text-sm shadow-sm outline-none focus:border-accent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {visible.map((product) => {
          const productLines = lines.filter((line) => line.productId === product.id)
          const available = !product.inventoryEnabled || product.variants.some((v) => v.stock > 0)
          return (
            <article key={product.id} className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm transition active:scale-[.99]">
              <button type="button" onClick={() => openProduct(product)} className="block w-full text-right">
                <div className="bg-secondary relative aspect-square">
                  <Image src={product.imageUrl || '/placeholder.svg'} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                  {product.inventoryEnabled && !available && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black text-white">نفد</span>
                  )}
                </div>
                <div className="p-3">
                  {product.category && <span className="text-accent-foreground bg-accent/20 rounded-full px-2 py-1 text-[10px] font-black">{product.category}</span>}
                  <h3 className="mt-2 line-clamp-2 text-sm font-black leading-5">{product.name}</h3>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-black">{product.price ?? pricing.unitPrice} دج</span>
                    {productLines.length > 0 && <span className="text-muted-foreground text-[10px] font-bold">{productLines.reduce((s, l) => s + l.quantity, 0)} في السلة</span>}
                  </div>
                </div>
              </button>
              <div className="px-3 pb-3">
                <button type="button" disabled={!available} onClick={() => openProduct(product)}
                  className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black disabled:opacity-40">
                  <Plus className="h-4 w-4" /> {available ? 'اختيار وإضافة' : 'غير متوفر'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {!visible.length && <p className="text-muted-foreground py-8 text-center text-sm">لا توجد نتائج مطابقة.</p>}

      {selected && (
        <div className="fixed inset-0 z-[70] bg-black/55 p-0 sm:p-6" onClick={() => setSelected(null)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
            className="bg-background absolute bottom-0 left-0 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl shadow-2xl sm:relative sm:mx-auto sm:mt-10 sm:max-w-lg sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur">
              <span className="text-sm font-black">تفاصيل المنتج</span>
              <button type="button" onClick={() => setSelected(null)} className="bg-secondary rounded-full p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-4 pb-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src={selected.imageUrl || '/placeholder.svg'} alt={selected.name} fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
              </div>
              <div className="mt-4">
                {selected.category && <span className="text-accent-foreground bg-accent/20 rounded-full px-2.5 py-1 text-xs font-black">{selected.category}</span>}
                <h2 className="mt-2 text-xl font-black">{selected.name}</h2>
                {selected.description && <p className="text-muted-foreground mt-2 text-sm leading-6">{selected.description}</p>}
                <p className="mt-4 text-xl font-black">{selectedVariant?.price ?? selected.price ?? pricing.unitPrice} دج</p>
              </div>

              {selected.inventoryEnabled && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-black">اختر اللون / المقاس</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selected.variants.map((variant) => {
                      const soldOut = variant.stock <= 0
                      return <button key={variant.id} type="button" disabled={soldOut} onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-right ${selectedVariant?.id === variant.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card'} ${soldOut ? 'opacity-40' : ''}`}>
                        <span className="font-bold">{variantLabel(variant)}</span>
                        <span className="text-xs font-black">{soldOut ? 'نفد' : `${variant.stock} متوفر`}</span>
                      </button>
                    })}
                  </div>
                </div>
              )}

              <button type="button" onClick={() => addProduct(selected)} disabled={selected.inventoryEnabled && (!selectedVariant || selectedVariant.stock <= 0)}
                className="bg-primary text-primary-foreground mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black shadow-lg disabled:opacity-40">
                <ShoppingBag className="h-5 w-5" /> إضافة إلى السلة <ChevronLeft className="h-4 w-4" />
              </button>

              {(() => {
                const similar = products
                  .filter((product) => product.id !== selected.id && (!selected.category || product.category === selected.category))
                  .slice(0, 6)

                return similar.length > 0 ? (
                  <section className="mt-7 border-t pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black">منتجات مشابهة</h3>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">قد تعجبك هذه المنتجات أيضاً</p>
                      </div>
                      <span className="text-muted-foreground text-[10px] font-bold">{similar.length} منتجات</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {similar.map((product) => {
                        const available = !product.inventoryEnabled || product.variants.some((v) => v.stock > 0)
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => openProduct(product)}
                            className="bg-card border-border w-36 shrink-0 overflow-hidden rounded-2xl border text-right shadow-sm transition active:scale-[.98]"
                          >
                            <div className="bg-secondary relative aspect-square">
                              <Image
                                src={product.imageUrl || '/placeholder.svg'}
                                alt={product.name}
                                fill
                                sizes="144px"
                                className="object-cover"
                              />
                              {product.inventoryEnabled && !available && (
                                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/75 px-1.5 py-0.5 text-[9px] font-black text-white">نفد</span>
                              )}
                            </div>
                            <div className="p-2.5">
                              <p className="line-clamp-2 min-h-9 text-xs font-black leading-4">{product.name}</p>
                              <p className="mt-1.5 text-xs font-black">{product.price ?? pricing.unitPrice} دج</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ) : null
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
