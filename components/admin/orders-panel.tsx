'use client'

import { deleteOrder, setOrderStatus } from '@/app/actions/admin'
import type { Order, OrderItem } from '@/lib/db/schema'
import { Phone, Trash2 } from 'lucide-react'

const STATUSES: { value: string; label: string; className: string }[] = [
  { value: 'new', label: 'جديد', className: 'bg-accent/25 text-accent-foreground' },
  { value: 'confirmed', label: 'مؤكد', className: 'bg-primary text-primary-foreground' },
  { value: 'delivered', label: 'تم التوصيل', className: 'bg-success text-success-foreground' },
  { value: 'cancelled', label: 'ملغى', className: 'bg-destructive text-destructive-foreground' },
]

export function OrdersPanel({ orders }: { orders: Order[] }) {
  const totalRevenue = orders
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-bold">كل الطلبات</p>
          <p className="text-2xl font-black">{orders.length}</p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-bold">طلبات جديدة</p>
          <p className="text-2xl font-black">{orders.filter((o) => o.status === 'new').length}</p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-bold">قطع مطلوبة</p>
          <p className="text-2xl font-black">{orders.reduce((sum, o) => sum + o.quantity, 0)}</p>
        </div>
        <div className="bg-card border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-bold">مبيعات موصّلة</p>
          <p className="text-2xl font-black">{totalRevenue} دج</p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {orders.map((order) => {
          const items = (order.items as OrderItem[]) ?? []
          return (
            <li key={order.id} className="bg-card border-border rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    #{order.id} — {order.customerName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {order.wilaya} · {new Date(order.createdAt).toLocaleString('ar-DZ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${order.phone}`}
                    className="bg-secondary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {order.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`حذف الطلب #${order.id}؟`)) deleteOrder(order.id)
                    }}
                    className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">حذف الطلب</span>
                  </button>
                </div>
              </div>

              <ul className="text-muted-foreground mt-3 flex flex-col gap-1 text-sm">
                {items.map((item, index) => (
                  <li key={`${order.id}-${index}`}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="bg-secondary mt-3 rounded-lg p-2 text-xs leading-relaxed">{order.notes}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold">
                  {order.quantity} قطعة × {order.unitPrice} دج ={' '}
                  <span className="font-black">{order.total} دج</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setOrderStatus(order.id, status.value)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        order.status === status.value
                          ? status.className
                          : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {orders.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">لا توجد طلبات بعد.</p>
      )}
    </div>
  )
}
