'use server'

import { ADMIN_COOKIE, requireAdmin, verifyPassword } from '@/lib/admin-auth'
import { db, isDbConfigured } from '@/lib/db'
import { orders, products, reviews } from '@/lib/db/schema'
import { setSetting } from '@/lib/settings'
import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export type ActionResult = { ok: boolean; message: string }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Shown instead of a crash while no database is connected to the project. */
const DB_REQUIRED: ActionResult = {
  ok: false,
  message: 'قاعدة البيانات غير مربوطة بعد، لا يمكن الحفظ حالياً.',
}

function str(form: FormData, key: string, max = 300) {
  return String(form.get(key) ?? '')
    .trim()
    .slice(0, max)
}

function refresh() {
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function login(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const token = await verifyPassword(String(form.get('password') ?? ''))
  if (!token) return { ok: false, message: 'كلمة السر غير صحيحة.' }

  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  revalidatePath('/admin')
  return { ok: true, message: 'مرحباً بك.' }
}

export async function logout() {
  ;(await cookies()).delete(ADMIN_COOKIE)
  revalidatePath('/admin')
}

export async function saveSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin()
  if (!isDbConfigured) return DB_REQUIRED

  const whatsapp = str(form, 'whatsappNumber', 20).replace(/[^0-9]/g, '')
  if (whatsapp.length < 9) return { ok: false, message: 'رقم واتساب غير صحيح (بالصيغة الدولية بدون +).' }

  const unitPrice = Number.parseInt(str(form, 'unitPrice', 8), 10)
  const bulkPrice = Number.parseInt(str(form, 'bulkPrice', 8), 10)
  const bulkThreshold = Number.parseInt(str(form, 'bulkThreshold', 8), 10)
  if (![unitPrice, bulkPrice, bulkThreshold].every((n) => Number.isFinite(n) && n > 0))
    return { ok: false, message: 'الأسعار والكمية يجب أن تكون أرقاماً أكبر من 0.' }

  await setSetting('whatsapp_number', whatsapp)
  await setSetting('unit_price', String(unitPrice))
  await setSetting('bulk_price', String(bulkPrice))
  await setSetting('bulk_threshold', String(bulkThreshold))
  await setSetting('store_name', str(form, 'storeName', 60) || 'SouhbaDz')
  await setSetting('announcement', str(form, 'announcement', 300))

  refresh()
  return { ok: true, message: 'تم حفظ الإعدادات.' }
}

export async function changePassword(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin()
  if (!isDbConfigured) return DB_REQUIRED
  const password = String(form.get('newPassword') ?? '')
  if (password.length < 6) return { ok: false, message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل.' }

  await setSetting('admin_password', password)
  ;(await cookies()).delete(ADMIN_COOKIE)
  revalidatePath('/admin')
  return { ok: true, message: 'تم تغيير كلمة السر. سجل الدخول من جديد.' }
}

async function uploadImage(file: File | null) {
  if (!file || file.size === 0) return null
  if (file.size > MAX_IMAGE_BYTES) throw new Error('حجم الصورة كبير جداً (الحد 5 ميغا).')
  if (!file.type.startsWith('image/')) throw new Error('الملف ليس صورة.')

  const blob = await put(`products/${Date.now()}-${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
  })
  return blob.url
}

export async function createProduct(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin()
  if (!isDbConfigured) return DB_REQUIRED

  const name = str(form, 'name', 120)
  if (name.length < 2) return { ok: false, message: 'المرجو كتابة اسم المنتج.' }

  let imageUrl = str(form, 'imageUrl', 600)
  try {
    const uploaded = await uploadImage(form.get('image') as File | null)
    if (uploaded) imageUrl = uploaded
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'فشل رفع الصورة.' }
  }
  if (!imageUrl) return { ok: false, message: 'المرجو إضافة صورة المنتج.' }

  const priceRaw = str(form, 'price', 8)
  const price = priceRaw ? Number.parseInt(priceRaw, 10) : null

  await db.insert(products).values({
    name,
    category: str(form, 'category', 60),
    description: str(form, 'description', 400),
    imageUrl,
    price: Number.isFinite(price as number) ? price : null,
    sortOrder: Number.parseInt(str(form, 'sortOrder', 6), 10) || 0,
  })

  refresh()
  return { ok: true, message: 'تمت إضافة المنتج.' }
}

export async function updateProduct(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin()
  if (!isDbConfigured) return DB_REQUIRED

  const id = Number.parseInt(str(form, 'id', 12), 10)
  if (!Number.isFinite(id)) return { ok: false, message: 'منتج غير موجود.' }

  const name = str(form, 'name', 120)
  if (name.length < 2) return { ok: false, message: 'المرجو كتابة اسم المنتج.' }

  let imageUrl = str(form, 'imageUrl', 600)
  try {
    const uploaded = await uploadImage(form.get('image') as File | null)
    if (uploaded) imageUrl = uploaded
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'فشل رفع الصورة.' }
  }

  const priceRaw = str(form, 'price', 8)
  const price = priceRaw ? Number.parseInt(priceRaw, 10) : null

  await db
    .update(products)
    .set({
      name,
      category: str(form, 'category', 60),
      description: str(form, 'description', 400),
      imageUrl,
      price: Number.isFinite(price as number) ? price : null,
      sortOrder: Number.parseInt(str(form, 'sortOrder', 6), 10) || 0,
    })
    .where(eq(products.id, id))

  refresh()
  return { ok: true, message: 'تم تحديث المنتج.' }
}

export async function toggleProduct(id: number, active: boolean) {
  await requireAdmin()
  if (!isDbConfigured) return
  await db.update(products).set({ active }).where(eq(products.id, id))
  refresh()
}

export async function deleteProduct(id: number) {
  await requireAdmin()
  if (!isDbConfigured) return
  await db.delete(products).where(eq(products.id, id))
  refresh()
}

export async function toggleReview(id: number, approved: boolean) {
  await requireAdmin()
  if (!isDbConfigured) return
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id))
  refresh()
}

export async function deleteReview(id: number) {
  await requireAdmin()
  if (!isDbConfigured) return
  await db.delete(reviews).where(eq(reviews.id, id))
  refresh()
}

export async function setOrderStatus(id: number, status: string) {
  await requireAdmin()
  if (!isDbConfigured) return
  const allowed = ['new', 'confirmed', 'delivered', 'cancelled']
  if (!allowed.includes(status)) return
  await db.update(orders).set({ status }).where(eq(orders.id, id))
  revalidatePath('/admin')
}

export async function deleteOrder(id: number) {
  await requireAdmin()
  if (!isDbConfigured) return
  await db.delete(orders).where(eq(orders.id, id))
  revalidatePath('/admin')
}
