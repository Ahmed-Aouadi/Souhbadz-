import { db, isDbConfigured } from '@/lib/db'
import { orders, type OrderItem } from '@/lib/db/schema'
import { getSettings, unitPriceFor } from '@/lib/settings'
import { sendOrderImage, sendOrderTemplate } from '@/lib/whatsapp'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function jsonError(message: string, status = 400) {
  console.error(`[api/send-order] ${status}: ${message}`)
  return Response.json({ ok: false, message }, { status })
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\s+/g, '')
    .replace(/^(?:\+213|00213)/, '0')
}
export async function POST(request: Request) {
  try {
    const form = await request.formData()

    const customerName = clean(form.get('customerName'), 80)
    const phone = normalizePhone(form.get('phone'))
    const wilaya = clean(form.get('wilaya'), 60)
    const notes = clean(form.get('notes'), 800)
    const rawItems = clean(form.get('items'), 12000)
    const images = form.getAll('image').filter((value): value is File => value instanceof File && value.size > 0)

    if (customerName.length < 2) return jsonError('المرجو كتابة الاسم الكامل.')
    if (!/^0[567][0-9]{8}$/.test(phone)) return jsonError('رقم الهاتف غير صحيح.')
    if (!wilaya) return jsonError('المرجو اختيار الولاية.')

    let parsed: unknown
    try {
      parsed = JSON.parse(rawItems || '[]')
    } catch {
      return jsonError('بيانات السلة غير صحيحة.')
    }

    const items: OrderItem[] = (Array.isArray(parsed) ? parsed : [])
      .map((item) => ({
        name: clean((item as Record<string, unknown>)?.name, 120),
        quantity: Math.min(
          Math.max(Math.round(Number((item as Record<string, unknown>)?.quantity) || 0), 1),
          1000,
        ),
      }))
      .filter((item) => item.name)

    if (items.length === 0) return jsonError('السلة فارغة.')

    const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
    if (quantity > 5000) return jsonError('الكمية كبيرة جداً، تواصل معنا مباشرة.')

    if (images.some((image) => !image.type.startsWith('image/'))) return jsonError('أحد الملفات المرفوعة ليس صورة.')
    if (images.some((image) => image.size > 3 * 1024 * 1024)) return jsonError('حجم إحدى الصور أكبر من 3 ميغابايت. أعد اختيار الصورة أو استخدم صورة أصغر.')
    if (images.length > 5) return jsonError('يمكن إرسال 5 صور كحد أقصى مع الطلب.')

    const settings = await getSettings()
    const unitPrice = unitPriceFor(quantity, settings)
    const total = quantity * unitPrice

    let orderId: number | null = null

    if (isDbConfigured) {
      try {
        const [row] = await db
          .insert(orders)
          .values({ customerName, phone, wilaya, notes, items, quantity, unitPrice, total })
          .returning({ id: orders.id })
        orderId = row?.id ?? null
        revalidatePath('/admin')
      } catch (error) {
        console.error('[db] order save failed:', error)
      }
    }

    const orderNumber = orderId ? `#${orderId}` : `SD-${Date.now().toString().slice(-8)}`
    const itemsText = items
      .map((item) => `${item.name} × ${item.quantity}`)
      .join(' • ')
      .slice(0, 700)

    // WhatsApp is the actual notification channel. If configuration is missing,
    // return a useful server-side error instead of silently opening wa.me.
    let templateSent = false
    try {
      await sendOrderTemplate({
        orderNumber,
        customerName,
        phone,
        wilaya,
        notes,
        itemsText,
        quantity,
        total,
      })
      templateSent = true
    } catch (error) {
      console.error('[whatsapp] template failed:', error instanceof Error ? error.message : error)
      return Response.json(
        {
          ok: false,
          orderId,
          message: `تم حفظ الطلب، لكن لم يتم إرساله إلى واتساب: ${
            error instanceof Error ? error.message : 'خطأ غير معروف'
          }`,
        },
        { status: 502 },
      )
    }

    let imageSent = images.length === 0
    let imageFailures = 0
    for (const image of images) {
      try {
        await sendOrderImage(image)
      } catch (error) {
        imageFailures += 1
        console.error('[whatsapp] image failed:', error instanceof Error ? error.message : error)
      }
    }
    imageSent = images.length === 0 || imageFailures === 0

    return Response.json({
      ok: templateSent,
      orderId,
      imageSent,
      message: images.length
        ? imageSent
          ? 'تم إرسال الطلب والصور مباشرة إلى واتساب.'
          : `تم إرسال الطلب إلى واتساب، لكن تعذر إرسال ${imageFailures} صورة. أرسلها يدويًا في المحادثة.`
        : 'تم إرسال الطلب مباشرة إلى واتساب.',
    })
  } catch (error) {
    console.error('[api/send-order] failed:', error instanceof Error ? error.message : error)
    return Response.json({ ok: false, message: 'حدث خطأ غير متوقع أثناء إرسال الطلب.' }, { status: 500 })
  }
}
