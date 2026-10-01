'use client'

import { bulkProductAction, createProduct, deleteProduct, toggleProduct, updateProduct } from '@/app/actions/admin'
import type { ProductVariant } from '@/lib/db/schema'
import type { StoreProduct } from '@/lib/queries'
import { CheckSquare, Eye, EyeOff, Pencil, Plus, Search, Trash2, X, Package, Minus } from 'lucide-react'
import Image from 'next/image'
import { useActionState, useEffect, useMemo, useState } from 'react'

const inputClass = 'border-input focus:border-accent focus:ring-ring/30 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2'

type VariantDraft = {
  id?: number
  sku: string
  color: string
  size: string
  price: string
  stock: string
  active: boolean
}

function toDraft(v: ProductVariant): VariantDraft {
  return { id: v.id, sku: v.sku, color: v.color, size: v.size, price: v.price?.toString() ?? '', stock: String(v.stock), active: v.active }
}

function ProductForm({ product, onDone }: { product?: StoreProduct; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(product ? updateProduct : createProduct, null)
  const [preview, setPreview] = useState(product?.imageUrl ?? '')
  const [inventoryEnabled, setInventoryEnabled] = useState(product?.inventoryEnabled ?? true)
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.length ? product.variants.map(toDraft) : [{ sku: '', color: '', size: '', price: '', stock: '0', active: true }],
  )

  useEffect(() => { if (state?.ok) onDone() }, [state, onDone])

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, ...patch } : v))
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="imageUrl" value={product?.imageUrl ?? ''} />
      <input type="hidden" name="inventoryEnabled" value={inventoryEnabled ? 'on' : ''} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

      <div>
        <label className="mb-1 block text-sm font-bold">اسم المنتج</label>
        <input name="name" required defaultValue={product?.name} className={inputClass} placeholder="مثال: بادج الكشافة" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-bold">التصنيف</label><input name="category" defaultValue={product?.category} className={inputClass} placeholder="بروشات / هدايا / أحذية..." /></div>
        <div><label className="mb-1 block text-sm font-bold">السعر الافتراضي</label><input name="price" type="number" min={1} defaultValue={product?.price ?? ''} className={inputClass} placeholder="مثال: 1000" /></div>
      </div>

      <div><label className="mb-1 block text-sm font-bold">الوصف</label><textarea name="description" rows={3} defaultValue={product?.description} className={inputClass} /></div>

      <div>
        <label className="mb-1 block text-sm font-bold">صورة المنتج</label>
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)) }} className="border-input w-full rounded-xl border px-3 py-2 text-sm" />
        {preview && <div className="bg-secondary relative mt-3 h-24 w-24 overflow-hidden rounded-xl"><Image src={preview} alt="معاينة" fill sizes="96px" className="object-cover" /></div>}
      </div>

      <div className="bg-secondary/60 border-border rounded-2xl border p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={inventoryEnabled} onChange={(e) => setInventoryEnabled(e.target.checked)} className="h-5 w-5" />
          <span><b className="block text-sm">تفعيل إدارة المخزون</b><small className="text-muted-foreground">عند التفعيل لن يقبل الموقع طلب كمية أكبر من المخزون.</small></span>
        </label>

        {inventoryEnabled && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between"><h4 className="font-black">الألوان والمقاسات والمخزون</h4><button type="button" onClick={() => setVariants((v) => [...v, { sku: '', color: '', size: '', price: '', stock: '0', active: true }])} className="bg-primary text-primary-foreground flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold"><Plus className="h-4 w-4" /> خيار</button></div>
            <div className="flex flex-col gap-3">
              {variants.map((v, i) => (
                <div key={i} className="bg-card border-border rounded-xl border p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <input value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })} placeholder="اللون" className={inputClass} />
                    <input value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })} placeholder="المقاس" className={inputClass} />
                    <input value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} type="number" min={1} placeholder="السعر" className={inputClass} />
                    <div className="flex gap-1"><input value={v.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} type="number" min={0} className={inputClass} placeholder="المخزون" /><button type="button" onClick={() => setVariants((prev) => prev.filter((_, x) => x !== i))} disabled={variants.length === 1} className="text-destructive rounded-lg p-2 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs"><input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} placeholder="SKU اختياري" className="border-input flex-1 rounded-lg border px-3 py-2" /><label className="flex items-center gap-1"><input type="checkbox" checked={v.active} onChange={(e) => updateVariant(i, { active: e.target.checked })} /> متاح</label></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div><label className="mb-1 block text-sm font-bold">ترتيب العرض</label><input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} className={inputClass} /></div>

      <div className="flex gap-2"><button type="submit" disabled={pending} className="bg-primary text-primary-foreground flex-1 rounded-xl py-3.5 font-black disabled:opacity-60">{pending ? 'جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}</button><button type="button" onClick={onDone} className="bg-secondary rounded-xl px-5 font-bold">إلغاء</button></div>
      {state && !state.ok && <p role="alert" className="text-destructive text-center text-sm font-bold">{state.message}</p>}
    </form>
  )
}

export function ProductsPanel({ products }: { products: StoreProduct[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [visibility, setVisibility] = useState('all')
  const [selected, setSelected] = useState<number[]>([])
  const [mode, setMode] = useState<{ type: 'none' } | { type: 'new' } | { type: 'edit'; product: StoreProduct }>({ type: 'none' })
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]
  const filtered = useMemo(() => products.filter((p) =>
    (!query || [p.name, p.category, p.description].join(' ').toLowerCase().includes(query.toLowerCase())) &&
    (category === 'all' || p.category === category) &&
    (visibility === 'all' || (visibility === 'active' ? p.active : !p.active))
  ), [products, query, category, visibility])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border-border rounded-2xl border p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث..." className="border-input w-full rounded-xl border py-2.5 pr-9 pl-3 text-sm" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="border-input rounded-xl border px-3 py-2.5 text-sm"><option value="all">كل التصنيفات</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select><select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="border-input rounded-xl border px-3 py-2.5 text-sm"><option value="all">كل الحالات</option><option value="active">نشط</option><option value="inactive">مخفي</option></select></div>
      </div>
      <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-black">المنتجات <span className="text-muted-foreground text-sm">({filtered.length})</span></h2><label className="text-muted-foreground flex items-center gap-2 text-xs"><input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={(e) => setSelected(e.target.checked ? filtered.map((p) => p.id) : [])} /> تحديد النتائج</label></div><button type="button" onClick={() => setMode({ type: 'new' })} className="bg-primary text-primary-foreground flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-black"><Plus className="h-4 w-4" /> منتج</button></div>

      {selected.length > 0 && <div className="bg-primary/10 border-primary/20 flex flex-wrap items-center gap-2 rounded-xl border p-3"><CheckSquare className="h-4 w-4" /><b className="text-xs">{selected.length} محدد</b><button onClick={() => bulkProductAction(selected, 'activate').then(() => setSelected([]))} className="bg-card rounded-lg px-3 py-1.5 text-xs font-bold">تفعيل</button><button onClick={() => bulkProductAction(selected, 'deactivate').then(() => setSelected([]))} className="bg-card rounded-lg px-3 py-1.5 text-xs font-bold">إخفاء</button><button onClick={() => confirm('حذف المنتجات المحددة؟') && bulkProductAction(selected, 'delete').then(() => setSelected([]))} className="bg-destructive text-destructive-foreground rounded-lg px-3 py-1.5 text-xs font-bold">حذف</button></div>}

      {mode.type !== 'none' && <div className="bg-card border-border rounded-2xl border p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="font-black">{mode.type === 'new' ? 'إضافة منتج' : 'تعديل المنتج'}</h3><button type="button" onClick={() => setMode({ type: 'none' })}><X className="h-5 w-5" /></button></div><ProductForm product={mode.type === 'edit' ? mode.product : undefined} onDone={() => setMode({ type: 'none' })} /></div>}

      <ul className="flex flex-col gap-2">
        {filtered.map((product) => {
          const stock = product.inventoryEnabled ? product.variants.reduce((s, v) => s + v.stock, 0) : null
          return <li key={product.id} className="bg-card border-border flex items-center gap-2 rounded-2xl border p-2.5 sm:p-3">
            <div className="bg-secondary relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"><Image src={product.imageUrl || '/placeholder.svg'} alt={product.name} fill sizes="56px" className="object-cover" /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{product.name}</p><p className="text-muted-foreground truncate text-[11px]">{product.category || 'بدون تصنيف'} {product.price ? `• ${product.price} دج` : ''}</p>{stock !== null && <p className={`mt-1 text-[10px] font-black ${stock === 0 ? 'text-red-600' : stock < 10 ? 'text-amber-600' : 'text-green-700'}`}><Package className="me-1 inline h-3 w-3" />{stock} في المخزون</p>}</div>
            <button type="button" onClick={() => toggleProduct(product.id, !product.active)} className="rounded-lg p-2 hover:bg-secondary">{product.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setMode({ type: 'edit', product })} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => confirm(`حذف "${product.name}" نهائياً؟`) && deleteProduct(product.id)} className="text-destructive rounded-lg p-2 hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </li>
        })}
      </ul>
      {!filtered.length && <p className="text-muted-foreground py-10 text-center text-sm">لا توجد منتجات.</p>}
    </div>
  )
}
