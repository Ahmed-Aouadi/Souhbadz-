'use client'

import { logout } from '@/app/actions/admin'
import { OrdersPanel } from '@/components/admin/orders-panel'
import { ProductsPanel } from '@/components/admin/products-panel'
import { ReviewsPanel } from '@/components/admin/reviews-panel'
import { SettingsPanel } from '@/components/admin/settings-panel'
import type { Order, Product, Review } from '@/lib/db/schema'
import type { StoreSettings } from '@/lib/settings'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

const TABS = [
  { id: 'orders', label: 'الطلبات' },
  { id: 'products', label: 'المنتجات' },
  { id: 'reviews', label: 'التقييمات' },
  { id: 'settings', label: 'الإعدادات' },
] as const

type TabId = (typeof TABS)[number]['id']

export function Dashboard({
  settings,
  products,
  reviews,
  orders,
}: {
  settings: StoreSettings
  products: Product[]
  reviews: Review[]
  orders: Order[]
}) {
  const [tab, setTab] = useState<TabId>('orders')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/souhbadz-logo.png"
              alt=""
              width={40}
              height={40}
              className="bg-card h-10 w-10 rounded-lg object-contain p-1"
            />
            <div>
              <h1 className="font-black">لوحة التحكم</h1>
              <p className="text-xs opacity-70">{settings.storeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-lg border border-current/30 px-3 py-2 text-xs font-bold">
              الموقع
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-current/30 px-3 py-2 text-xs font-bold"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-card border-border sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${
                tab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl grow px-4 py-6">
        {tab === 'orders' && <OrdersPanel orders={orders} />}
        {tab === 'products' && <ProductsPanel products={products} />}
        {tab === 'reviews' && <ReviewsPanel reviews={reviews} />}
        {tab === 'settings' && <SettingsPanel settings={settings} />}
      </main>
    </div>
  )
}
