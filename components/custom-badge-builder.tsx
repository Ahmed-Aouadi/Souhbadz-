'use client'

import { useState } from 'react'
import { AlertCircle, ImagePlus, RotateCcw, ShoppingCart, Upload } from 'lucide-react'
import { useCart } from '@/components/cart-provider'

const MAX_QUANTITY = 1000

export function CustomBadgeBuilder() {
  const { add, pricing } = useCart()
  const [imageUrl, setImageUrl] = useState('')
  const [quantity, setQuantity] = useState(1)

  const unitPrice = quantity >= pricing.bulkThreshold ? pricing.bulkPrice : pricing.unitPrice
  const total = quantity * unitPrice

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة فقط.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setImageUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function addToCart() {
    if (!imageUrl) {
      alert('ارفع صورة التصميم أولاً.')
      return
    }

    add(
      {
        id: -Date.now(),
        name: 'بادج مخصص',
        imageUrl,
      },
      quantity,
    )
  }

  return (
    <section id="custom-badge" className="mb-14 scroll-mt-24">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black">صمّم بادجك بنفسك</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          ارفع الصورة، اختر الكمية، ثم أضف التصميم إلى السلة.
        </p>
      </div>

      <div className="bg-card border-border grid gap-6 overflow-hidden rounded-2xl border p-5 shadow-sm lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-bold">صورة أو شعار التصميم</label>
            <label className="border-border bg-secondary hover:bg-accent/10 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-5 transition">
              <Upload className="h-5 w-5" />
              <span className="text-sm font-bold">{imageUrl ? 'تغيير الصورة' : 'رفع الصورة'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
            </label>

            <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-right">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs font-medium leading-relaxed text-amber-800">
                الصورة هنا للمعاينة وإرسالها مع الطلب فقط. لن يتم حفظها في الموقع، وستُرسل إلى رقم واتساب المتجر عند تأكيد الطلب.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="custom-quantity" className="mb-2 block text-sm font-bold">الكمية</label>
            <input
              id="custom-quantity"
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, Number(e.target.value) || 1)))}
              className="border-input bg-background focus:border-accent focus:ring-ring/30 w-full rounded-xl border px-3 py-3 text-sm font-bold outline-none focus:ring-2"
            />
          </div>

          {quantity < pricing.bulkThreshold ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-800">
              أضف {pricing.bulkThreshold - quantity} حبة للوصول إلى سعر {pricing.bulkPrice} دج للحبة.
            </div>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-800">
              حصلت على سعر الجملة: {pricing.bulkPrice} دج للحبة.
            </div>
          )}

          <button
            type="button"
            onClick={addToCart}
            disabled={!imageUrl}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black transition"
          >
            <ShoppingCart className="h-5 w-5" />
            إضافة الطلب إلى السلة
          </button>

          <button
            type="button"
            onClick={() => { setImageUrl(''); setQuantity(1) }}
            className="border-border bg-secondary hover:bg-accent/20 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة التصميم
          </button>
        </div>

        <div className="bg-secondary flex flex-col rounded-2xl p-5">
          <p className="text-muted-foreground mb-5 text-center text-sm font-bold">معاينة الشارة</p>

          <div className="flex flex-1 items-center justify-center py-4">
            <div className="relative h-64 w-64 rounded-full bg-gradient-to-br from-white via-gray-300 to-gray-600 p-[5px] shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
              <div className="relative h-full w-full rounded-full bg-gradient-to-br from-gray-100 via-gray-400 to-gray-600 p-[5px] shadow-[inset_0_2px_5px_rgba(255,255,255,.9),inset_0_-4px_8px_rgba(0,0,0,.35)]">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-[inset_0_0_10px_rgba(0,0,0,.25)]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="معاينة الشارة" className="absolute inset-0 h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                      <ImagePlus className="h-14 w-14 text-gray-300" />
                      <span className="text-xs font-bold text-gray-400">ارفع صورة للمعاينة</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border-border mt-5 overflow-hidden rounded-2xl border">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-muted-foreground text-sm">المنتج</span>
              <span className="text-sm font-black">بادج مخصص</span>
            </div>
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-muted-foreground text-sm">الكمية</span>
              <span className="rounded-lg bg-secondary px-3 py-1 text-sm font-black">{quantity} قطعة</span>
            </div>
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-muted-foreground text-sm">سعر القطعة</span>
              <span className="text-sm font-black">{unitPrice} دج</span>
            </div>
            <div className="bg-primary/5 flex items-center justify-between px-4 py-4">
              <span className="font-black">المبلغ الإجمالي</span>
              <span className="text-xl font-black">{total.toLocaleString('ar-DZ')} دج</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
