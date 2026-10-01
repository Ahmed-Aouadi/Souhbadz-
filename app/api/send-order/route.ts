import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { sql, eq } from 'drizzle-orm'
import { db, isDbConfigured } from '@/lib/db'
import { ensureInventorySchema } from '@/lib/db/inventory'
import { orders, productVariants, products, stockMovements, type OrderItem } from '@/lib/db/schema'
import { getSettings, unitPriceFor } from '@/lib/settings'
import { sendOrderImage, sendOrderTemplate } from '@/lib/whatsapp'

export const runtime = 'nodejs'

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status })
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\s+/g, '')
    .replace(/^(?:\+213|00213)/, '0')
}

function clientKey(request: Request, phone: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(`${ip}:${phone}`).digest('hex').slice(0, 64)
}

async function checkRateLimit(request: Request, phone: string) {
  if (!isDbConfigured) return true
  const key = clientKey(request, phone)
  const now = Date.now()
  const rows = await db.execute(sql`SELECT "windowStart", count FROM order_rate_limits WHERE "rateKey" = ${key} LIMIT 1`)
  const row = rows.rows[0] as { windowStart?: Date | string; count?: number } | undefined
  const windowStart = row?.windowStart ? new Date(row.windowStart).getTime() : 0
  const windowMs = 10 * 60 * 1000
  if (!row || now - windowStart >= windowMs) {
    await db.execute(sql`
      INSERT INTO order_rate_limits ("rateKey", "windowStart", count)
      VALUES (${key}, now(), 1)
      ON CONFLICT ("rateKey") DO UPDATE SET "windowStart" = now(), count = 1
    `)
    return true
  }
  if (Number(row.count) >= 8) return false
  await db.execute(sql`UPDATE order_rate_limits SET count = count + 1 WHERE "rateKey" = ${key}`)
  return true
}

type IncomingItem = {
  productId: number
  variantId?: number
  quantity: number
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const customerName = clean(form.get('customerName'), 80)
    const phone = normalizePhone(form.get('phone'))
    const wilaya = clean(form.get('wilaya'), 80)
    const notes = clean(form.get('notes'), 800)
    const rawItems = clean(form.get('items'), 20000)
    const requestKey = clean(form.get('requestKey'), 100)
    const images = form.getAll('image').filter((value): value is File => value instanceof File && value.size > 0)

    if (customerName.length < 2) return jsonError('المرجو كتابة الاسم الكامل.')
    if (!/^0[567][0-9]{8}$/.test(phone)) return jsonError('رقم الهاتف غير صحيح.')
    if (!wilaya) return jsonError('المرجو اختيار الولاية.')
    if (!requestKey || requestKey.length < 20) return jsonError('تعذر التحقق من الطلب، أعد المحاولة.')

    let parsed: unknown
    try { parsed = JSON.parse(rawItems || '[]') } catch { return jsonError('بيانات السلة غير صحيحة.') }
    if (!Array.isArray(parsed)) return jsonError('بيانات السلة غير صحيحة.')

    const incoming: IncomingItem[] = parsed.slice(0, 100).map((item) => {
      const value = item as Record<string, unknown>
      return {
        productId: Math.round(Number(value.productId) || 0),
        variantId: value.variantId == null ? undefined : Math.round(Number(value.variantId) || 0),
        quantity: Math.min(Math.max(Math.round(Number(value.quantity) || 0), 1), 1000),
      }
    }).filter((item) => item.productId > 0)

    if (!incoming.length) return jsonError('السلة فارغة.')
    const quantity = incoming.reduce((sum, item) => sum + item.quantity, 0)
    if (quantity > 5000) return jsonError('الكمية كبيرة جداً، تواصل معنا مباشرة.')

    if (images.length > 5) return jsonError('يمكن إرسال 5 صور كحد أقصى مع الطلب.')
    if (images.some((image) => !image.type.startsWith('image/'))) return jsonError('أحد الملفات المرفوعة ليس صورة.')
    if (images.some((image) => image.size > 3 * 1024 * 1024)) return jsonError('حجم إحدى الصور أكبر من 3 ميغابايت.')

    if (isDbConfigured) {
      await ensureInventorySchema()
      if (!(await checkRateLimit(request, phone))) return jsonError('تم تجاوز عدد المحاولات. انتظر بضع دقائق ثم أعد المحاولة.', 429)
    }

    const settings = await getSettings()
    let orderId: number | null = null
    let items: OrderItem[] = []
    let total = 0

    if (isDbConfigured) {
      const result = await db.transaction(async (tx) => {
        const existing = await tx.select({
          id: orders.id,
          status: orders.status,
          notificationStatus: orders.notificationStatus,
        }).from(orders).where(eq(orders.requestKey, requestKey)).limit(1)
        if (existing[0]) return { existing: existing[0] }

        const built: OrderItem[] = []
        let runningTotal = 0

        for (const item of incoming) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1)
          if (!product || !product.active) throw new Error('أحد المنتجات لم يعد متاحاً.')
          if (product.inventoryEnabled) {
            if (!item.variantId) throw new Error(`اختر اللون أو المقاس للمنتج: ${product.name}`)
            const [variant] = await tx.select().from(productVariants)
              .where(sql`id = ${item.variantId} AND "productId" = ${product.id} AND active = true`)
              .limit(1)
            if (!variant) throw new Error(`الخيار المحدد للمنتج "${product.name}" غير متاح.`)
            const updated = await tx.execute(sql`
              UPDATE product_variants
              SET stock = stock - ${item.quantity}
              WHERE id = ${variant.id} AND "productId" = ${product.id} AND active = true AND stock >= ${item.quantity}
              RETURNING stock
            `)
            if (!updated.rows.length) throw new Error(`الكمية المطلوبة من "${product.name}" غير متوفرة.`)
            const unit = variant.price ?? product.price ?? unitPriceFor(quantity, settings)
            built.push({
              productId: product.id,
              variantId: variant.id,
              name: product.name,
              quantity: item.quantity,
              unitPrice: unit,
              options: { color: variant.color || undefined, size: variant.size || undefined },
            })
            runningTotal += unit * item.quantity
            await tx.insert(stockMovements).values({
              variantId: variant.id,
              type: 'sale',
              quantity: -item.quantity,
              reference: requestKey,
            })
          } else {
            const unit = product.price ?? unitPriceFor(quantity, settings)
            built.push({ productId: product.id, name: product.name, quantity: item.quantity, unitPrice: unit })
            runningTotal += unit * item.quantity
          }
        }

        const average = Math.max(1, Math.round(runningTotal / quantity))
        const [row] = await tx.insert(orders).values({
          customerName, phone, wilaya, notes, items: built, quantity,
          unitPrice: average, total: runningTotal, requestKey,
          notificationStatus: 'pending',
        }).returning({ id: orders.id })
        return { row, built, total: runningTotal }
      })

      if ('existing' in result) {
        orderId = result.existing.id
        if (result.existing.notificationStatus === 'sent') {
          return Response.json({ ok: true, orderId, message: 'هذا الطلب مسجل بالفعل.' })
        }
        items = []
      } else {
        orderId = result.row?.id ?? null
        items = result.built
        total = result.total
      }
      revalidatePath('/admin')
    } else {
      items = incoming.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: 'منتج',
        quantity: item.quantity,
        unitPrice: unitPriceFor(quantity, settings),
      }))
      total = quantity * unitPriceFor(quantity, settings)
    }

    if (!orderId && !isDbConfigured) {
      total = quantity * unitPriceFor(quantity, settings)
    }

    const orderNumber = orderId ? `#${orderId}` : `SD-${Date.now().toString().slice(-8)}`
    const itemsText = items.length
      ? items.map((item) => `${item.name}${item.options?.color || item.options?.size ? ` (${[item.options.color, item.options.size].filter(Boolean).join(' / ')})` : ''} × ${item.quantity}`).join(' • ').slice(0, 900)
      : 'الطلب مسجل مسبقاً'

    try {
      await sendOrderTemplate({ orderNumber, customerName, phone, wilaya, notes, itemsText, quantity, total })
      if (orderId && isDbConfigured) {
        await db.update(orders).set({ notificationStatus: 'sent', notificationError: '', notifiedAt: new Date() }).where(eq(orders.id, orderId))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف'
      if (orderId && isDbConfigured) await db.update(orders).set({ notificationStatus: 'failed', notificationError: message.slice(0, 500) }).where(eq(orders.id, orderId))
      return Response.json({ ok: false, orderId, message: 'تم حفظ الطلب، لكن تعذر إرساله إلى واتساب. سيبقى الطلب محفوظاً في لوحة التحكم.' }, { status: 502 })
    }

    let imageFailures = 0
    for (const image of images) {
      try { await sendOrderImage(image) } catch (error) {
        imageFailures += 1
        console.error('[whatsapp] image failed:', error instanceof Error ? error.message : error)
      }
    }

    return Response.json({
      ok: true,
      orderId,
      imageSent: imageFailures === 0,
      message: images.length && imageFailures
        ? `تم تسجيل الطلب وإرساله إلى واتساب، لكن تعذر إرسال ${imageFailures} صورة. أرسلها يدوياً في المحادثة.`
        : 'تم تسجيل الطلب وإرساله مباشرة إلى واتساب.',
    })
  } catch (error) {
    console.error('[api/send-order] failed:', error instanceof Error ? error.message : error)
    const message = error instanceof Error ? error.message : ''
    return Response.json({ ok: false, message: message || 'حدث خطأ غير متوقع أثناء إرسال الطلب.' }, { status: 400 })
  }
}
