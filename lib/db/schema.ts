import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').default('').notNull(),
  description: text('description').default('').notNull(),
  imageUrl: text('imageUrl').default('').notNull(),
  price: integer('price'),
  active: boolean('active').default(true).notNull(),
  inventoryEnabled: boolean('inventoryEnabled').default(false).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('productId').notNull(),
  sku: text('sku').default('').notNull(),
  color: text('color').default('').notNull(),
  size: text('size').default('').notNull(),
  price: integer('price'),
  stock: integer('stock').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  variantId: integer('variantId').notNull(),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  reference: text('reference').default('').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').default('').notNull(),
  approved: boolean('approved').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customerName').notNull(),
  phone: text('phone').notNull(),
  wilaya: text('wilaya').notNull(),
  notes: text('notes').default('').notNull(),
  items: jsonb('items').default([]).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unitPrice').notNull(),
  total: integer('total').notNull(),
  status: text('status').default('new').notNull(),
  requestKey: text('requestKey'),
  notificationStatus: text('notificationStatus').default('pending').notNull(),
  notificationError: text('notificationError').default('').notNull(),
  notifiedAt: timestamp('notifiedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export type Product = typeof products.$inferSelect
export type ProductVariant = typeof productVariants.$inferSelect
export type Review = typeof reviews.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = {
  productId: number
  variantId?: number
  name: string
  quantity: number
  unitPrice: number
  options?: { color?: string; size?: string }
}
