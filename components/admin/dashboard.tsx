'use client'

import { logout } from '@/app/actions/admin'
import { OrdersPanel } from '@/components/admin/orders-panel'
import { ProductsPanel } from '@/components/admin/products-panel'
import { ReviewsPanel } from '@/components/admin/reviews-panel'
import { SettingsPanel } from '@/components/admin/settings-panel'
import type { Order, Review } from '@/lib/db/schema'
import type { StoreProduct } from '@/lib/queries'
import type { StoreSettings } from '@/lib/settings'
import { BarChart3, Boxes, ClipboardList, LogOut, PackageCheck, Star } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
  { id: 'orders', label: 'الطلبات', icon: ClipboardList },
  { id: 'products', label: 'المنتجات', icon: Boxes },
  { id: 'reviews', label: 'التقييمات', icon: Star },
  { id: 'settings', label: 'الإعدادات', icon: PackageCheck },
] as const
type TabId = (typeof TABS)[number]['id']

export function Dashboard({ settings, products, reviews, orders }: { settings: StoreSettings; products: StoreProduct[]; reviews: Review[]; orders: Order[] }) {
  const [tab, setTab] = useState<TabId>('overview')
  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered')
    const revenue = delivered.reduce((s,o)=>s+o.total,0)
    const pending = orders.filter(o=>o.status==='new'||o.status==='confirmed'||o.status==='shipped').length
    const cancelled = orders.filter(o=>o.status==='cancelled').length
    const units = orders.reduce((s,o)=>s+o.quantity,0)
    const top = new Map<string, number>()
    orders.forEach(o => (Array.isArray(o.items) ? o.items : []).forEach((item: any) => top.set(item.name,(top.get(item.name)||0)+Number(item.quantity||0))))
    return { revenue, pending, cancelled, units, delivered: delivered.length, top: [...top.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5) }
  }, [orders])
  return <div className="flex min-h-screen flex-col">
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3"><Image src="/souhbadz-logo.png" alt="" width={40} height={40} className="bg-card h-10 w-10 rounded-lg object-contain p-1"/><div><h1 className="font-black">لوحة التحكم الاحترافية</h1><p className="text-xs opacity-70">{settings.storeName}</p></div></div>
        <div className="flex items-center gap-2"><a href="/" className="rounded-lg border border-current/30 px-3 py-2 text-xs font-bold">الموقع</a><form action={logout}><button type="submit" className="flex items-center gap-1.5 rounded-lg border border-current/30 px-3 py-2 text-xs font-bold"><LogOut className="h-3.5 w-3.5"/>خروج</button></form></div>
      </div>
    </header>
    <nav className="bg-card border-border sticky top-0 z-10 border-b"><div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2" role="tablist">{TABS.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" role="tab" aria-selected={tab===item.id} onClick={()=>setTab(item.id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition ${tab===item.id?'bg-primary text-primary-foreground':'text-muted-foreground hover:bg-secondary'}`}><Icon className="h-4 w-4"/>{item.label}</button>})}</div></nav>
    <main className="mx-auto w-full max-w-6xl grow px-4 py-6">
      {tab==='overview' && <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['الإيرادات المكتملة',`${stats.revenue} دج`],['الطلبات المعلقة',stats.pending],['الطلبات المكتملة',stats.delivered],['الوحدات المطلوبة',stats.units]].map(([a,b])=><div key={a} className="bg-card border-border rounded-2xl border p-5"><p className="text-muted-foreground text-xs font-bold">{a}</p><p className="mt-1 text-2xl font-black">{b}</p></div>)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="bg-card border-border rounded-2xl border p-5"><h2 className="font-black">صحة المتجر</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="bg-secondary rounded-xl p-4"><b>{products.length}</b><span className="text-muted-foreground block">إجمالي المنتجات</span></div><div className="bg-secondary rounded-xl p-4"><b>{products.filter(p=>p.active).length}</b><span className="text-muted-foreground block">منتجات نشطة</span></div><div className="bg-secondary rounded-xl p-4"><b>{reviews.filter(r=>!r.approved).length}</b><span className="text-muted-foreground block">تقييمات تنتظر المراجعة</span></div><div className="bg-secondary rounded-xl p-4"><b>{stats.cancelled}</b><span className="text-muted-foreground block">طلبات ملغاة</span></div></div></section>
          <section className="bg-card border-border rounded-2xl border p-5"><h2 className="font-black">الأكثر طلبًا</h2>{stats.top.length?<ol className="mt-4 flex flex-col gap-3">{stats.top.map(([name,q],i)=><li key={name} className="flex items-center justify-between border-b pb-2 text-sm"><span><b className="ml-2">{i+1}.</b>{name}</span><strong>{q} قطعة</strong></li>)}</ol>:<p className="text-muted-foreground mt-4 text-sm">لا توجد بيانات كافية بعد.</p>}</section>
        </div>
        <button onClick={()=>setTab('orders')} className="bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-bold">فتح إدارة الطلبات</button>
      </div>}
      {tab==='orders' && <OrdersPanel orders={orders}/>}
      {tab==='products' && <ProductsPanel products={products}/>}
      {tab==='reviews' && <ReviewsPanel reviews={reviews}/>}
      {tab==='settings' && <SettingsPanel settings={settings}/>}
    </main>
  </div>
}