import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getSetting } from '@/lib/settings'

export const ADMIN_COOKIE = 'sdz_admin'

async function adminPassword() {
  const password = (await getSetting('admin_password')) || process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD is not configured')
  return password
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

function verifyStoredPassword(input: string, stored: string) {
  if (stored.startsWith('scrypt$')) {
    const [, salt, expected] = stored.split('$')
    if (!salt || !expected) return false
    const actual = scryptSync(input, salt, 64).toString('hex')
    return safeEqual(actual, expected)
  }
  return safeEqual(input, stored)
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

export async function verifyPassword(input: string) {
  const password = await adminPassword()
  if (!input || !verifyStoredPassword(input, password)) return null
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

export function hashAdminPassword(password: string) {
  return hashPassword(password)
}
