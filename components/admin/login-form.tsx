'use client'

import { login } from '@/app/actions/admin'
import { Lock } from 'lucide-react'
import Image from 'next/image'
import { useActionState } from 'react'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={formAction}
        className="bg-card border-border flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6 shadow-lg"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/souhbadz-logo.png"
            alt="شعار SouhbaDz"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <h1 className="text-xl font-black">لوحة تحكم SouhbaDz</h1>
          <p className="text-muted-foreground text-sm">هذه الصفحة خاصة بصاحب الموقع فقط</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-bold">
            كلمة السر
          </label>
          <div className="relative">
            <Lock
              className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border py-2 pr-10 pl-3 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold transition disabled:opacity-60"
        >
          {pending ? 'جاري الدخول...' : 'دخول'}
        </button>

        {state && !state.ok && (
          <p role="alert" className="text-destructive text-center text-sm font-bold">
            {state.message}
          </p>
        )}

        <a href="/" className="text-muted-foreground text-center text-xs underline">
          العودة إلى الموقع
        </a>
      </form>
    </main>
  )
}
