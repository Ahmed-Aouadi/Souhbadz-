import { sql } from 'drizzle-orm'
import { db, isDbConfigured } from '@/lib/db'

let ready: Promise<void> | null = null

export async function ensureInventorySchema() {
  if (!isDbConfigured) return
  if (!ready) {
    ready = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS settings (
          key text PRIMARY KEY,
          value text NOT NULL,
          "updatedAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS products (
          id serial PRIMARY KEY,
          name text NOT NULL,
          category text NOT NULL DEFAULT '',
          description text NOT NULL DEFAULT '',
          "imageUrl" text NOT NULL DEFAULT '',
          price integer,
          active boolean NOT NULL DEFAULT true,
          "inventoryEnabled" boolean NOT NULL DEFAULT false,
          "sortOrder" integer NOT NULL DEFAULT 0,
          "createdAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id serial PRIMARY KEY,
          name text NOT NULL,
          rating integer NOT NULL,
          comment text NOT NULL DEFAULT '',
          approved boolean NOT NULL DEFAULT true,
          "createdAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS orders (
          id serial PRIMARY KEY,
          "customerName" text NOT NULL,
          phone text NOT NULL,
          wilaya text NOT NULL,
          notes text NOT NULL DEFAULT '',
          items jsonb NOT NULL DEFAULT '[]'::jsonb,
          quantity integer NOT NULL,
          "unitPrice" integer NOT NULL,
          total integer NOT NULL,
          status text NOT NULL DEFAULT 'new',
          "createdAt" timestamp NOT NULL DEFAULT now()
        );
        ALTER TABLE products ADD COLUMN IF NOT EXISTS "inventoryEnabled" boolean NOT NULL DEFAULT false;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS "requestKey" text;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS "notificationStatus" text NOT NULL DEFAULT 'pending';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS "notificationError" text NOT NULL DEFAULT '';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS "notifiedAt" timestamp;
        CREATE UNIQUE INDEX IF NOT EXISTS orders_request_key_unique ON orders ("requestKey") WHERE "requestKey" IS NOT NULL;
        CREATE TABLE IF NOT EXISTS product_variants (
          id serial PRIMARY KEY,
          "productId" integer NOT NULL,
          sku text NOT NULL DEFAULT '',
          color text NOT NULL DEFAULT '',
          size text NOT NULL DEFAULT '',
          price integer,
          stock integer NOT NULL DEFAULT 0,
          active boolean NOT NULL DEFAULT true,
          "createdAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants ("productId");
        CREATE TABLE IF NOT EXISTS stock_movements (
          id serial PRIMARY KEY,
          "variantId" integer NOT NULL,
          type text NOT NULL,
          quantity integer NOT NULL,
          reference text NOT NULL DEFAULT '',
          "createdAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS stock_movements_variant_id_idx ON stock_movements ("variantId");
        CREATE TABLE IF NOT EXISTS order_rate_limits (
          "rateKey" text PRIMARY KEY,
          "windowStart" timestamp NOT NULL,
          count integer NOT NULL DEFAULT 0
        );
      `)
    })().catch((error) => {
      ready = null
      throw error
    })
  }
  await ready
}
