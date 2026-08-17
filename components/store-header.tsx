'use client'

import { useCart } from '@/components/cart-provider'
import { ShoppingBag } from 'lucide-react'
import Image from 'next/image'

export function StoreHeader({ storeName }: { storeName: string }) {
  const { totalQuantity, setOpen } = useCart()

  return (
    <nav className="bg-card/95 border-border sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/souhbadz-logo.png"
            alt={`شعار ${storeName}`}
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-black">
              Souhba<span className="text-accent">Dz</span>
            </span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-[0.2em]">
              BADGES &amp; GIFTS
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          <span>السلة</span>
          {totalQuantity > 0 && (
            <span className="bg-accent text-accent-foreground absolute -top-2 -left-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black">
              {totalQuantity}
            </span>
          )}
          <span className="sr-only">عرض سلة المشتريات</span>
        </button>
      </div>
    </nav>
  )
}
