import { Dashboard } from '@/components/admin/dashboard'
import { LoginForm } from '@/components/admin/login-form'
import { isAdmin } from '@/lib/admin-auth'
import { getAllOrders, getAllProducts, getAllReviews } from '@/lib/queries'
import { getSettings } from '@/lib/settings'

export const metadata = {
  title: 'لوحة التحكم | SouhbaDz',
  description: 'إدارة الطلبات والمنتجات والتقييمات وإعدادات متجر SouhbaDz',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <LoginForm />
  }

  const [settings, products, reviews, orders] = await Promise.all([
    getSettings(),
    getAllProducts(),
    getAllReviews(),
    getAllOrders(),
  ])

  return <Dashboard settings={settings} products={products} reviews={reviews} orders={orders} />
}
