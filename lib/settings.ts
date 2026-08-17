import { db, safeRead } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export type StoreSettings = {
  whatsappNumber: string
  unitPrice: number
  bulkPrice: number
  bulkThreshold: number
  storeName: string
  announcement: string
}

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: '213668874240',
  unitPrice: 100,
  bulkPrice: 70,
  bulkThreshold: 20,
  storeName: 'SouhbaDz',
  announcement: 'عرض خاص: سعر الحبة 100 دج | 20 حبة أو أكثر = 70 دج للحبة! + سعر التوصيل',
}

const KEY_MAP: Record<string, keyof StoreSettings> = {
  whatsapp_number: 'whatsappNumber',
  unit_price: 'unitPrice',
  bulk_price: 'bulkPrice',
  bulk_threshold: 'bulkThreshold',
  store_name: 'storeName',
  announcement: 'announcement',
}

export async function getSettings(): Promise<StoreSettings> {
  const rows = await safeRead(() => db.select().from(settings), [], 'getSettings')
  const result = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    const field = KEY_MAP[row.key]
    if (!field) continue
    if (field === 'unitPrice' || field === 'bulkPrice' || field === 'bulkThreshold') {
      const parsed = Number.parseInt(row.value, 10)
      if (Number.isFinite(parsed)) result[field] = parsed
    } else {
      result[field] = row.value
    }
  }
  return result
}

export async function getSetting(key: string): Promise<string | null> {
  const rows = await safeRead(
    () => db.select().from(settings).where(sql`${settings.key} = ${key}`),
    [],
    `getSetting(${key})`,
  )
  return rows[0]?.value ?? null
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
}

/** Unit price rule: reaching the bulk threshold (default 20) drops the price per piece. */
export function unitPriceFor(quantity: number, s: Pick<StoreSettings, 'unitPrice' | 'bulkPrice' | 'bulkThreshold'>) {
  return quantity >= s.bulkThreshold ? s.bulkPrice : s.unitPrice
}
