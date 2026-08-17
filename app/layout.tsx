import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'SouhbaDz | بروشات وهدايا مخصصة',
  description:
    'SouhbaDz - Badges & Gifts. بروشات مخصصة بجودة عالية في الجزائر: سعر الحبة 100 دج، و20 حبة أو أكثر بـ 70 دج للحبة + التوصيل لكل الولايات.',
  generator: 'v0.app',
  icons: { icon: '/souhbadz-logo.png', apple: '/souhbadz-logo.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} bg-background`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
