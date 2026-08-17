import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getSetting } from '@/lib/settings'

export const ADMIN_COOKIE = 'sdz_admin'
async function adminPassword() {
  const password = (await getSetting('admin_password')) || process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD is not configured')
  return password
}

function sign(password: string) {
  const secret = `${process.env.DATABASE_URL ?? 'souhbadz'}::${password}`
  return createHmac('sha256', secret).update('souhbadz-admin-session').digest('hex')
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** Verifies a submitted password and returns the session token to store in a cookie. */
export async function verifyPassword(input: string) {
  const password = await adminPassword()
  if (!input || !safeEqual(input, password)) return null
  return sign(password)
}

export async function isAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!token) return false
  return safeEqual(token, sign(await adminPassword()))
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('غير مصرح')
}
