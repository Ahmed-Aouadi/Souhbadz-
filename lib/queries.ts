import { db, safeRead } from '@/lib/db'
import { orders, productVariants, products, reviews } from '@/lib/db/schema'
import type { Order, Product, ProductVariant, Review } from '@/lib/db/schema'
import { asc, desc, eq } from 'drizzle-orm'

export type StoreProduct = Product & { variants: ProductVariant[] }

async function withVariants(rows: Product[]): Promise<StoreProduct[]> {
  if (!rows.length) return []
  const variants = await safeRead(
    () => db.select().from(productVariants).where(eq(productVariants.active, true)).orderBy(asc(productVariants.id)),
    [],
    'getProductVariants',
  )
  return rows.map((product) => ({ ...product, variants: variants.filter((v) => v.productId === product.id) }))
}

export async function getActiveProducts(): Promise<StoreProduct[]> {
  const rows = await safeRead(
    () => db.select().from(products).where(eq(products.active, true)).orderBy(asc(products.sortOrder), asc(products.id)),
    [],
    'getActiveProducts',
  )
  return withVariants(rows)
}

export async function getAllProducts(): Promise<StoreProduct[]> {
  const rows = await safeRead(
    () => db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id)),
    [],
    'getAllProducts',
  )
  const variants = await safeRead(() => db.select().from(productVariants).orderBy(asc(productVariants.id)), [], 'getAllProductVariants')
  return rows.map((product) => ({ ...product, variants: variants.filter((v) => v.productId === product.id) }))
}

export async function getApprovedReviews(): Promise<Review[]> {
  return safeRead(() => db.select().from(reviews).where(eq(reviews.approved, true)).orderBy(desc(reviews.createdAt)), [], 'getApprovedReviews')
}

export async function getAllReviews(): Promise<Review[]> {
  return safeRead(() => db.select().from(reviews).orderBy(desc(reviews.createdAt)), [], 'getAllReviews')
}

export async function getAllOrders(): Promise<Order[]> {
  return safeRead(() => db.select().from(orders).orderBy(desc(orders.createdAt)), [], 'getAllOrders')
}
