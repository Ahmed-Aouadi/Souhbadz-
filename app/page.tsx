import { CartDrawer } from '@/components/cart-drawer'
import { CartProvider } from '@/components/cart-provider'
import { ProductGrid } from '@/components/product-grid'
import { CustomBadgeBuilder } from '@/components/custom-badge-builder'
import { ReviewsSection } from '@/components/reviews-section'
import { StoreHeader } from '@/components/store-header'
import { getActiveProducts, getApprovedReviews } from '@/lib/queries'
import { getSettings } from '@/lib/settings'
import { Palette, Sparkles, Truck } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const FEATURES = [
  { icon: Sparkles, title: 'جودة طبع عالية', text: 'ألوان واضحة وطبقة حماية لامعة تدوم طويلاً' },
  { icon: Palette, title: 'تصميم مخصص مجاناً', text: 'ابعث لنا صورتك أو فكرتك ونحن نصممها لك' },
  { icon: Truck, title: 'توصيل لكل الولايات', text: 'التوصيل عن طريق شركات النقل + الدفع عند الاستلام' },
]

export default async function Page() {
  const [settings, products, reviews] = await Promise.all([
    getSettings(),
    getActiveProducts(),
    getApprovedReviews(),
  ])

  return (
    <CartProvider
      pricing={{
        unitPrice: settings.unitPrice,
        bulkPrice: settings.bulkPrice,
        bulkThreshold: settings.bulkThreshold,
      }}
    >
      <div id="top" className="flex min-h-screen flex-col">
        {settings.announcement && (
          <p className="bg-accent text-accent-foreground px-3 py-2 text-center text-sm font-bold">
            {settings.announcement}
          </p>
        )}

        <StoreHeader storeName={settings.storeName} />

        <header className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center">
            <Image
              src="/souhbadz-logo.png"
              alt=""
              width={112}
              height={112}
              className="bg-card h-28 w-28 rounded-2xl object-contain p-2"
            />
            <h1 className="text-balance text-3xl font-black md:text-4xl">
              بروشات وهدايا مخصصة من <span className="text-accent">{settings.storeName}</span>
            </h1>
            <p className="text-pretty max-w-xl text-base leading-relaxed opacity-90 md:text-lg">
              اصنع هويتك مع بروشات بجودة طبع عالية، تصميم مخصص مجاني، وتوصيل لكل ولايات الجزائر.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#products"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-6 py-3 font-bold transition"
              >
                تسوّق الآن
              </a>
              <a
                href="#custom-badge"
                className="rounded-xl border border-current/30 px-6 py-3 font-bold transition hover:bg-white/10"
              >
                صمّم بادجك
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl grow px-4 py-10">
          <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-card border-border flex flex-col items-center gap-2 rounded-xl border p-5 text-center shadow-sm"
              >
                <Icon className="text-accent h-6 w-6" aria-hidden="true" />
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </section>

          <CustomBadgeBuilder />

          <section id="products" className="mb-14">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black">التصاميم المتوفرة</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                أضف ما تريد إلى السلة — {settings.bulkThreshold} حبة أو أكثر بـ {settings.bulkPrice} دج للحبة
              </p>
            </div>
            <ProductGrid products={products} />
          </section>

          <ReviewsSection reviews={reviews} />
        </main>

        <footer className="bg-primary text-primary-foreground mt-14">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm">
            <Image
              src="/souhbadz-logo.png"
              alt=""
              width={56}
              height={56}
              className="bg-card h-14 w-14 rounded-xl object-contain p-1"
            />
            <p className="text-base font-black">
              Souhba<span className="text-accent">Dz</span>
            </p>
            <p className="text-[10px] font-bold tracking-[0.2em] opacity-70">BADGES &amp; GIFTS</p>
            <p className="mt-2 opacity-90">
              سعر الحبة {settings.unitPrice} دج — {settings.bulkThreshold} حبة أو أكثر بـ {settings.bulkPrice} دج
              للحبة + سعر التوصيل
            </p>
          </div>
        </footer>

        <CartDrawer />
      </div>
    </CartProvider>
  )
}
