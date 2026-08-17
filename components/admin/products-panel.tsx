'use client'

import { createProduct, deleteProduct, toggleProduct, updateProduct } from '@/app/actions/admin'
import type { Product } from '@/lib/db/schema'
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import { useActionState, useEffect, useState } from 'react'

const inputClass =
  'border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2'

function ProductForm({
  product,
  onDone,
}: {
  product?: Product
  onDone: () => void
}) {
  const [state, formAction, pending] = useActionState(product ? updateProduct : createProduct, null)
  const [preview, setPreview] = useState(product?.imageUrl ?? '')

  useEffect(() => {
    if (state?.ok) onDone()
  }, [state, onDone])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="imageUrl" value={product?.imageUrl ?? ''} />

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-bold">
          اسم المنتج
        </label>
        <input id="name" name="name" required defaultValue={product?.name} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-bold">
            التصنيف
          </label>
          <input
            id="category"
            name="category"
            defaultValue={product?.category}
            placeholder="مثال: أنيمي ومانغا"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-bold">
            سعر خاص (اختياري)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={1}
            defaultValue={product?.price ?? ''}
            placeholder="اتركه فارغاً للسعر العام"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-bold">
          الوصف
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="image" className="mb-1 block text-sm font-bold">
          صورة المنتج {product ? '(اتركها فارغة للإبقاء على الصورة الحالية)' : ''}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) setPreview(URL.createObjectURL(file))
          }}
          className="border-input w-full rounded-lg border px-3 py-2 text-sm"
        />
        {preview && (
          <div className="bg-secondary relative mt-3 h-24 w-24 overflow-hidden rounded-lg">
            <Image src={preview} alt="معاينة صورة المنتج" fill sizes="96px" className="object-cover" />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="sortOrder" className="mb-1 block text-sm font-bold">
          ترتيب العرض
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={product?.sortOrder ?? 0}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-xl py-3 font-bold transition disabled:opacity-60"
        >
          {pending ? 'جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="bg-secondary text-secondary-foreground rounded-xl px-5 py-3 font-bold"
        >
          إلغاء
        </button>
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-destructive text-center text-sm font-bold">
          {state.message}
        </p>
      )}
    </form>
  )
}

export function ProductsPanel({ products }: { products: Product[] }) {
  const [mode, setMode] = useState<{ type: 'none' } | { type: 'new' } | { type: 'edit'; product: Product }>({
    type: 'none',
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">المنتجات ({products.length})</h2>
        {mode.type === 'none' && (
          <button
            type="button"
            onClick={() => setMode({ type: 'new' })}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            منتج جديد
          </button>
        )}
      </div>

      {mode.type !== 'none' && (
        <div className="bg-card border-border rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{mode.type === 'new' ? 'إضافة منتج' : 'تعديل منتج'}</h3>
            <button type="button" onClick={() => setMode({ type: 'none' })} className="p-1">
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">إلغاء</span>
            </button>
          </div>
          <ProductForm
            key={mode.type === 'edit' ? mode.product.id : 'new'}
            product={mode.type === 'edit' ? mode.product : undefined}
            onDone={() => setMode({ type: 'none' })}
          />
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="bg-card border-border flex items-center gap-3 rounded-xl border p-3"
          >
            <div className="bg-secondary relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={product.imageUrl || '/placeholder.svg'}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{product.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {product.category || 'بدون تصنيف'}
                {product.price ? ` — ${product.price} دج` : ''}
                {!product.active ? ' — مخفي' : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => toggleProduct(product.id, !product.active)}
                className="hover:bg-secondary rounded-lg p-2 transition"
                title={product.active ? 'إخفاء من الموقع' : 'إظهار في الموقع'}
              >
                {product.active ? (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeOff className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">{product.active ? 'إخفاء' : 'إظهار'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode({ type: 'edit', product })}
                className="hover:bg-secondary rounded-lg p-2 transition"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">تعديل</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`حذف "${product.name}" نهائياً؟`)) deleteProduct(product.id)
                }}
                className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">حذف</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {products.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">لا توجد منتجات بعد.</p>
      )}
    </div>
  )
}
