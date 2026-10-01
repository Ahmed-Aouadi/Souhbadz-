import { sql } from 'drizzle-orm'
import { db, isDbConfigured } from '@/lib/db'

let ready: Promise<void> | null = null

export async function ensureInventorySchema() {
  if (!isDbConfigured) return
  if (!ready) {
    ready = (async () => {
      await db.execute(sql`
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
      `)
    })().catch((error) => {
      ready = null
      throw error
    })
  }
  await ready
}
