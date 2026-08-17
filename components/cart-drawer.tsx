'use client'

import { useCart } from '@/components/cart-provider'
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة',
  'تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر العاصمة','الجلفة','جيجل','سطيف','سعيدة',
  'سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة',
  'وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة',
  'سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان','تيميمون',
  'برج باجي مختار','أولاد جلال','بني عباس','عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة',
]

type Status = { ok: boolean; message: string } | null

export function CartDrawer() {
  const { lines, open, setOpen, totalQuantity, unitPrice, total, pricing, piecesToBulk, setQuantity, remove, clear } =
    useCart()

  const [form, setForm] = useState({ customerName: '', phone: '', wilaya: '', notes: '' })
  const [status, setStatus] = useState<Status>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  async function compressImage(file: File) {
    const bitmap = await createImageBitmap(file)
    const maxSize = 1600
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82),
    )
    if (!blob) return file
    return new File([blob], `souhbadz-${Date.now()}.jpg`, { type: 'image/jpeg' })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setStatus(null)

    try {
      const payload = new FormData()
      payload.append('customerName', form.customerName)
      payload.append('phone', form.phone)
      payload.append('wilaya', form.wilaya)
      payload.append('notes', form.notes)
      payload.append(
        'items',
        JSON.stringify(lines.map((line) => ({ name: line.name, quantity: line.quantity }))),
      )

      for (const line of lines) {
        if (!line.imageUrl.startsWith('data:')) continue
        const response = await fetch(line.imageUrl)
        const blob = await response.blob()
        const original = new File([blob], `souhbadz-${Math.abs(line.id)}.jpg`, { type: blob.type || 'image/jpeg' })
        const compressed = await compressImage(original)
        payload.append('image', compressed)
      }

      const response = await fetch('/api/send-order', { method: 'POST', body: payload })
      const result = await response.json().catch(() => ({ ok: false, message: 'استجابة غير صالحة من الخادم.' }))

      if (!response.ok || !result.ok) {
        setStatus({ ok: false, message: result.message || 'تعذر إرسال الطلب.' })
        return
      }

      setStatus({ ok: true, message: result.message })
      clear()
      setForm({ customerName: '', phone: '', wilaya: '', notes: '' })
    } catch (error) {
      setStatus({
        ok: false,
        message: error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.',
      })
    } finally {
      setPending(false)
    }
  }


  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سلة المشتريات"
        className={`bg-card fixed top-0 left-0 z-50 flex h-full w-full max-w-md flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <header className="border-border flex items-center justify-between border-b px-4 py-4">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            سلة المشتريات
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hover:bg-secondary rounded-lg p-2 transition"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">إغلاق السلة</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {lines.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              السلة فارغة. اختر تصاميمك من الأعلى.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="border-border flex items-center gap-3 rounded-xl border p-3"
                >
                  <div className="bg-secondary relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={line.imageUrl || '/placeholder.svg'}
                      alt={line.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="truncate text-sm font-bold">{line.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="bg-secondary hover:bg-accent/30 rounded-md p-1.5 transition"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">تقليل الكمية</span>
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={line.quantity}
                        onChange={(event) => setQuantity(line.id, Number(event.target.value))}
                        aria-label={`كمية ${line.name}`}
                        className="border-input w-16 rounded-md border py-1 text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="bg-secondary hover:bg-accent/30 rounded-md p-1.5 transition"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">زيادة الكمية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(line.id)}
                        className="text-destructive ms-auto p-1.5"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">حذف من السلة</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && (
            <>
              {piecesToBulk > 0 && (
                <p className="bg-accent/20 text-accent-foreground mt-4 rounded-xl p-3 text-xs font-bold leading-relaxed">
                  أضف {piecesToBulk} حبة أخرى لتحصل على سعر {pricing.bulkPrice} دج للحبة بدل{' '}
                  {pricing.unitPrice} دج.
                </p>
              )}

              <div className="border-border mt-4 flex flex-col gap-1 rounded-xl border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-bold">{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الحبة</span>
                  <span className="font-bold">{unitPrice} دج</span>
                </div>
                <div className="border-border mt-1 flex justify-between border-t pt-2 text-base">
                  <span className="font-bold">المجموع</span>
                  <span className="font-black">{total} دج</span>
                </div>
                <p className="text-muted-foreground text-xs">التوصيل غير محسوب في المجموع</p>
              </div>

              <div className="bg-accent/15 border-accent mt-4 flex gap-2 rounded-xl border p-3">
                <AlertTriangle className="text-accent-foreground h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-xs font-bold leading-relaxed">
                  تنبيه مهم: الموقع لا يرفع صور التصميم. بعد الإرسال، أرسل صورة التصميم بنفسك في
                  دردشة واتساب.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                <div>
                  <label htmlFor="customerName" className="mb-1 block text-sm font-bold">
                    الاسم الكامل
                  </label>
                  <input
                    id="customerName"
                    required
                    value={form.customerName}
                    onChange={(event) => setForm({ ...form, customerName: event.target.value })}
                    placeholder="مثال: أحمد بن علي"
                    className="border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-bold">
                    رقم الهاتف
                  </label>
                  <input
                    id="phone"
                    required
                    type="tel"
                    inputMode="tel"
                    pattern="0[567][0-9]{8}"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="0XXXXXXXXX"
                    className="border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="wilaya" className="mb-1 block text-sm font-bold">
                    الولاية
                  </label>
                  <select
                    id="wilaya"
                    required
                    value={form.wilaya}
                    onChange={(event) => setForm({ ...form, wilaya: event.target.value })}
                    className="border-input bg-card focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  >
                    <option value="">اختر الولاية</option>
                    {WILAYAS.map((wilaya) => (
                      <option key={wilaya} value={wilaya}>
                        {wilaya}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="mb-1 block text-sm font-bold">
                    ملاحظات أو وصف التصميم (اختياري)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    placeholder="الألوان، المقاس، أو أي طلب خاص"
                    className="border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl py-3 font-bold transition disabled:opacity-60"
                >
                  {pending ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب'}
                </button>
              </form>
            </>
          )}

          {status && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-3 text-center text-sm font-bold leading-relaxed ${
                status.ok ? 'text-success' : 'text-destructive'
              }`}
            >
              {status.message}
            </p>
          )}

        </div>
      </aside>
    </>
  )
}
