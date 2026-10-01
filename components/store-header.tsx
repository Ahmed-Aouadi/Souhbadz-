'use client'

import { useCart } from '@/components/cart-provider'
import { Home, ShoppingBag, Sparkles, Search } from 'lucide-react'
import Image from 'next/image'

export function StoreHeader({ storeName }: { storeName: string }) {
  const { totalQuantity, setOpen } = useCart()

  return (
    <>
      <nav className="bg-card/95 border-border sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <Image src="/souhbadz-logo.png" alt={storeName} width={42} height={42} className="h-10 w-10 shrink-0 rounded-xl object-contain" />
            <span className="min-w-0">
              <span className="block truncate text-base font-black">Souhba<span className="text-accent">Dz</span></span>
              <span className="text-muted-foreground hidden text-[9px] font-bold tracking-[0.18em] sm:block">BADGES &amp; GIFTS</span>
            </span>
          </a>

          <div className="hidden items-center gap-1 sm:flex">
            <a href="#products" className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-secondary">المنتجات</a>
            <a href="#custom-badge" className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-secondary">التخصيص</a>
          </div>

          <button type="button" onClick={() => setOpen(true)} className="bg-primary text-primary-foreground relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-black shadow-sm">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden xs:inline">السلة</span>
            {totalQuantity > 0 && <span className="bg-accent text-accent-foreground absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-black">{totalQuantity}</span>}
          </button>
        </div>
      </nav>

      <nav className="bg-card/95 border-border fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <a href="#top" className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-black"><Home className="h-5 w-5" />الرئيسية</a>
        <a href="#products" className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-black"><Search className="h-5 w-5" />المنتجات</a>
        <a href="#custom-badge" className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-black"><Sparkles className="h-5 w-5" />صمّم</a>
        <button type="button" onClick={() => setOpen(true)} className="relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-black"><ShoppingBag className="h-5 w-5" />السلة>{totalQuantity > 0 && <span className="bg-accent absolute right-5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black">{totalQuantity}</span>}</button>
      </nav>
    </>
  )
}
