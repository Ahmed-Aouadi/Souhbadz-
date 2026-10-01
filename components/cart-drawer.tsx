'use client'

import { useCart } from '@/components/cart-provider'
import { Minus, Plus, ShoppingBag, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر العاصمة','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال','بني عباس','عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة',
  'آفلو','بريكة','القنطرة','بئر العاتر','العريشة','قصر الشلالة','عين وسارة','مسعد','قصر البخاري','بوسعادة','الأبيض سيدي الشيخ',
]

type Status = { ok: boolean; message: string } | null

export function CartDrawer() {
  const { lines, open, setOpen, totalQuantity, total, pricing, piecesToBulk, setQuantity, remove, clear } = useCart()
  const [form, setForm] = useState({ customerName: '', phone: '', wilaya: '', notes: '' })
  const [status, setStatus] = useState<Status>(null)
  const [pending, setPending] = useState(false)

  const allAvailable = useMemo(() => lines.every((line) => line.maxStock === undefined || line.quantity <= line.maxStock), [lines])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
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
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) return file
    return new File([blob], `souhbadz-${Date.now()}.jpg`, { type: 'image/jpeg' })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!lines.length || !allAvailable) return
    setPending(true)
    setStatus(null)

    try {
      const payload = new FormData()
      payload.append('customerName', form.customerName)
      payload.append('phone', form.phone)
      payload.append('wilaya', form.wilaya)
      payload.append('notes', form.notes)
      payload.append('requestKey', crypto.randomUUID())
      payload.append('items', JSON.stringify(lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        custom: line.custom === true,
      }))))

      for (const line of lines) {
        if (!line.imageUrl.startsWith('data:')) continue
        const response = await fetch(line.imageUrl)
        const blob = await response.blob()
        const original = new File([blob], `souhbadz-${Math.abs(line.productId)}.jpg`, { type: blob.type || 'image/jpeg' })
        payload.append('image', await compressImage(original))
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
      setStatus({ ok: false, message: error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {open && <button type="button" aria-label="إغلاق السلة" className="fixed inset-0 z-40 cursor-default bg-black/55" onClick={() => setOpen(false)} />}
      <aside role="dialog" aria-modal="true" aria-label="سلة المشتريات"
        className={`bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col rounded-t-3xl shadow-2xl transition-transform duration-300 sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:rounded-r-3xl ${open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full'}`}>
        <header className="border-border flex shrink-0 items-center justify-between border-b px-4 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black"><ShoppingBag className="h-5 w-5" /> سلة المشتريات</h2>
            {totalQuantity > 0 && <p className="text-muted-foreground mt-1 text-xs">{totalQuantity} قطعة في السلة</p>}
          </div>
          <button type="button" onClick={() => setOpen(false)} className="bg-secondary rounded-full p-2"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {!lines.length ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <ShoppingBag className="text-muted-foreground/30 h-16 w-16" />
              <p className="mt-4 font-black">السلة فارغة</p>
              <p className="text-muted-foreground mt-1 text-xs">اختر منتجاتك وسيتم حفظها تلقائياً.</p>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {lines.map((line) => {
                  const price = line.unitPrice ?? (totalQuantity >= pricing.bulkThreshold ? pricing.bulkPrice : pricing.unitPrice)
                  return <li key={line.key} className="bg-card border-border flex gap-3 rounded-2xl border p-3 shadow-sm">
                    <div className="bg-secondary h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <img src={line.imageUrl || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-black">{line.name}</p>
                          {(line.options?.color || line.options?.size) && <p className="text-muted-foreground mt-1 text-[11px]">{[line.options.color, line.options.size].filter(Boolean).join(' • ')}</p>}
                        </div>
                        <button type="button" onClick={() => remove(line.key)} className="text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="bg-secondary flex items-center rounded-xl">
                          <button type="button" onClick={() => setQuantity(line.key, line.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="min-w-8 text-center text-xs font-black">{line.quantity}</span>
                          <button type="button" disabled={!!line.maxStock && line.quantity >= line.maxStock} onClick={() => setQuantity(line.key, line.quantity + 1)} className="p-2 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="text-sm font-black">{(price * line.quantity).toLocaleString('ar-DZ')} دج</span>
                      </div>
                      {line.maxStock !== undefined && <p className="text-muted-foreground mt-1 text-[10px]">{line.maxStock > 0 ? `${line.maxStock} متوفر حالياً` : 'نفد المخزون'}</p>}
                    </div>
                  </li>
                })}
              </ul>

              {piecesToBulk > 0 && <p className="bg-accent/15 text-accent-foreground mt-4 rounded-xl p-3 text-xs font-bold">أضف {piecesToBulk} قطعة للوصول إلى سعر {pricing.bulkPrice} دج للحبة.</p>}

              <div className="bg-card border-border mt-4 rounded-2xl border p-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">القطع</span><b>{totalQuantity}</b></div>
                <div className="mt-2 flex justify-between border-t pt-2 text-base"><span className="font-black">الإجمالي</span><b>{total.toLocaleString('ar-DZ')} دج</b></div>
                <p className="text-muted-foreground mt-1 text-[10px]">سعر التوصيل غير محسوب.</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 pb-2">
                <h3 className="text-base font-black">بيانات التوصيل</h3>
                <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="الاسم الكامل" className="border-input bg-card w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-accent" />
                <input required type="tel" inputMode="tel" pattern="0[567][0-9]{8}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الهاتف 0XXXXXXXXX" className="border-input bg-card w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-accent" />
                <select required value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} className="border-input bg-card w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-accent">
                  <option value="">اختر الولاية</option>
                  {WILAYAS.map((wilaya) => <option key={wilaya} value={wilaya}>{wilaya}</option>)}
                </select>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="ملاحظة للطلب (اختياري)" className="border-input bg-card w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-accent" />
                <button type="submit" disabled={pending || !allAvailable} className="bg-primary text-primary-foreground sticky bottom-0 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black shadow-xl disabled:opacity-50">
                  {pending ? 'جاري تأكيد الطلب...' : <>تأكيد الطلب • {total.toLocaleString('ar-DZ')} دج</>}
                </button>
                {status && <div className={`flex items-start gap-2 rounded-xl p-3 text-xs font-bold ${status.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {status.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{status.message}</span>
                </div>}
              </form>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
