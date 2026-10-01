import { CartDrawer } from '@/components/cart-drawer'
import { CartProvider } from '@/components/cart-provider'
import { ProductGrid } from '@/components/product-grid'
import { CustomBadgeBuilder } from '@/components/custom-badge-builder'
import { ReviewsSection } from '@/components/reviews-section'
import { StoreHeader } from '@/components/store-header'
import { getActiveProducts, getApprovedReviews } from '@/lib/queries'
import { getSettings } from '@/lib/settings'
import { ensureInventorySchema } from '@/lib/db/inventory'
import { Palette, Sparkles, Truck } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const FEATURES = [
  { icon: Sparkles, title: 'جودة عالية', text: 'طباعة واضحة وتشطيب ممتاز' },
  { icon: Palette, title: 'تخصيص مجاني', text: 'ارفع فكرتك ونحن نهتم بالباقي' },
  { icon: Truck, title: 'توصيل الجزائر', text: 'لكل الولايات والدفع عند الاستلام' },
]

export default async function Page() {
  await ensureInventorySchema()
  const [settings, products, reviews] = await Promise.all([getSettings(), getActiveProducts(), getApprovedReviews()])

  return (
    <CartProvider pricing={{ unitPrice: settings.unitPrice, bulkPrice: settings.bulkPrice, bulkThreshold: settings.bulkThreshold }}>
      <div id="top" className="min-h-screen pb-16 sm:pb-0">
        {settings.announcement && <div className="bg-accent text-accent-foreground overflow-hidden px-3 py-2 text-center text-[11px] font-black">{settings.announcement}</div>}
        <StoreHeader storeName={settings.storeName} />

        <header className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-7 text-right sm:justify-center sm:gap-8 sm:py-12 sm:text-center">
            <Image src="/souhbadz-logo.png" alt="" width={78} height={78} className="bg-card h-16 w-16 shrink-0 rounded-2xl p-1.5 object-contain sm:h-24 sm:w-24" />
            <div className="min-w-0">
              <p className="text-accent text-xs font-black sm:text-sm">SouhbaDz • BADGES &amp; GIFTS</p>
              <h1 className="mt-1 text-xl font-black leading-tight sm:text-4xl">بروشات وهدايا مخصصة</h1>
              <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 opacity-85 sm:text-base">منتجات مميزة، تخصيص سهل، وتوصيل لكل ولايات الجزائر.</p>
              <a href="#products" className="bg-accent text-accent-foreground mt-3 inline-flex rounded-xl px-4 py-2 text-xs font-black sm:px-6 sm:py-3 sm:text-sm">تسوّق الآن</a>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
          <section className="mb-8 grid grid-cols-3 gap-2 sm:mb-12 sm:gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card border-border rounded-2xl border p-3 text-center shadow-sm sm:p-5">
                <Icon className="text-accent mx-auto h-5 w-5 sm:h-6 sm:w-6" />
                <h3 className="mt-2 text-[11px] font-black sm:text-base">{title}</h3>
                <p className="text-muted-foreground mt-1 hidden text-xs leading-relaxed sm:block">{text}</p>
              </div>
            ))}
          </section>

          <CustomBadgeBuilder />

          <section id="products" className="scroll-mt-20 mb-12">
            <div className="mb-4 flex items-end justify-between">
              <div><h2 className="text-xl font-black sm:text-2xl">اكتشف المنتجات</h2><p className="text-muted-foreground mt-1 text-xs">اختر المنتج ثم اللون والمقاس والكمية.</p></div>
              <span className="text-muted-foreground text-[10px] font-bold">{products.length} منتج</span>
            </div>
            <ProductGrid products={products} />
          </section>

          <ReviewsSection reviews={reviews} />
        </main>

        <footer className="bg-primary text-primary-foreground mt-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-xs">
            <Image src="/souhbadz-logo.png" alt="" width={48} height={48} className="bg-card h-12 w-12 rounded-xl p-1 object-contain" />
            <p className="text-base font-black">Souhba<span className="text-accent">Dz</span></p>
            <p className="opacity-75">تسوّق بسهولة من هاتفك • الدفع عند الاستلام</p>
          </div>
        </footer>
        <CartDrawer />
      </div>
    </CartProvider>
  )
}
