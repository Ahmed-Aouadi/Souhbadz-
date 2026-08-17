import { db, safeRead } from '@/lib/db'
import { orders, products, reviews } from '@/lib/db/schema'
import type { Order, Product, Review } from '@/lib/db/schema'
import { asc, desc, eq } from 'drizzle-orm'

export async function getActiveProducts(): Promise<Product[]> {
  return safeRead(
    () =>
      db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(asc(products.sortOrder), asc(products.id)),
    [],
    'getActiveProducts',
  )
}

export async function getAllProducts(): Promise<Product[]> {
  return safeRead(
    () => db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id)),
    [],
    'getAllProducts',
  )
}

export async function getApprovedReviews(): Promise<Review[]> {
  return safeRead(
    () => db.select().from(reviews).where(eq(reviews.approved, true)).orderBy(desc(reviews.createdAt)),
    [],
    'getApprovedReviews',
  )
}

export async function getAllReviews(): Promise<Review[]> {
  return safeRead(() => db.select().from(reviews).orderBy(desc(reviews.createdAt)), [], 'getAllReviews')
}

export async function getAllOrders(): Promise<Order[]> {
  return safeRead(() => db.select().from(orders).orderBy(desc(orders.createdAt)), [], 'getAllOrders')
}
