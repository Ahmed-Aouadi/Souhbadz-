'use server'

import { db, isDbConfigured } from '@/lib/db'
import { orders, reviews, type OrderItem } from '@/lib/db/schema'
import { getSettings, unitPriceFor } from '@/lib/settings'
import { revalidatePath } from 'next/cache'

export type ActionResult = { ok: boolean; message: string }

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function submitReview(input: {
  name: string
  rating: number
  comment: string
}): Promise<ActionResult> {
  const name = clean(input.name, 60)
  const comment = clean(input.comment, 600)
  const rating = Math.round(Number(input.rating))

  if (name.length < 2) return { ok: false, message: 'المرجو كتابة اسمك.' }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5)
    return { ok: false, message: 'المرجو اختيار تقييم من 1 إلى 5 نجوم.' }

  if (!isDbConfigured)
    return { ok: false, message: 'التقييمات غير متوفرة حالياً. المرجو المحاولة لاحقاً.' }

  try {
    await db.insert(reviews).values({ name, rating, comment })
  } catch (error) {
    console.error('[db] submitReview failed:', error instanceof Error ? error.message : error)
    return { ok: false, message: 'تعذر حفظ التقييم. المرجو المحاولة لاحقاً.' }
  }

  revalidatePath('/')
  return { ok: true, message: 'شكراً! تم نشر تقييمك.' }
}

export async function saveOrder(input: {
  customerName: string
  phone: string
  wilaya: string
  notes: string
  items: OrderItem[]
}): Promise<ActionResult & { orderId?: number }> {
  const customerName = clean(input.customerName, 80)
  const phone = clean(input.phone, 20)
  const wilaya = clean(input.wilaya, 60)
  const notes = clean(input.notes, 800)

  if (customerName.length < 2) return { ok: false, message: 'المرجو كتابة الاسم الكامل.' }
  if (!/^0[567][0-9]{8}$/.test(phone)) return { ok: false, message: 'رقم الهاتف غير صحيح.' }
  if (!wilaya) return { ok: false, message: 'المرجو كتابة الولاية.' }

  const items: OrderItem[] = (Array.isArray(input.items) ? input.items : [])
    .map((item) => ({
      name: clean(item?.name, 120),
      quantity: Math.min(Math.max(Math.round(Number(item?.quantity) || 0), 1), 1000),
    }))
    .filter((item) => item.name)

  if (items.length === 0) return { ok: false, message: 'السلة فارغة.' }

  const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
  if (quantity > 5000) return { ok: false, message: 'الكمية كبيرة جداً، تواصل معنا مباشرة.' }

  // Prices are always recomputed on the server from stored settings.
  const settings = await getSettings()
  const unitPrice = unitPriceFor(quantity, settings)
  const total = quantity * unitPrice

  // The WhatsApp hand-off is the real order channel, so a storage failure
  // (no database connected yet) must not block the customer.
  if (!isDbConfigured) return { ok: true, message: 'تم تحضير الطلب.' }

  try {
    const [row] = await db
      .insert(orders)
      .values({ customerName, phone, wilaya, notes, items, quantity, unitPrice, total })
      .returning({ id: orders.id })

    revalidatePath('/admin')
    return { ok: true, message: 'تم تسجيل الطلب.', orderId: row.id }
  } catch (error) {
    console.error('[db] saveOrder failed:', error instanceof Error ? error.message : error)
    return { ok: true, message: 'تم تحضير الطلب.' }
  }
}
