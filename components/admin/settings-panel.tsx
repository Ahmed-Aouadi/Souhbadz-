'use client'

import { changePassword, saveSettings } from '@/app/actions/admin'
import type { StoreSettings } from '@/lib/settings'
import { useActionState } from 'react'

const inputClass =
  'border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2'

export function SettingsPanel({ settings }: { settings: StoreSettings }) {
  const [state, formAction, pending] = useActionState(saveSettings, null)
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null)

  return (
    <div className="flex flex-col gap-6">
      <form
        action={formAction}
        className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
      >
        <h2 className="text-lg font-black">إعدادات المتجر</h2>

        <div>
          <label htmlFor="whatsappNumber" className="mb-1 block text-sm font-bold">
            رقم واتساب (صيغة دولية بدون +)
          </label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={settings.whatsappNumber}
            inputMode="numeric"
            required
            className={inputClass}
          />
          <p className="text-muted-foreground mt-1 text-xs">مثال: 213668874240 للرقم 0668874240</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="unitPrice" className="mb-1 block text-sm font-bold">
              سعر الحبة (دج)
            </label>
            <input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min={1}
              defaultValue={settings.unitPrice}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bulkPrice" className="mb-1 block text-sm font-bold">
              سعر الجملة (دج)
            </label>
            <input
              id="bulkPrice"
              name="bulkPrice"
              type="number"
              min={1}
              defaultValue={settings.bulkPrice}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bulkThreshold" className="mb-1 block text-sm font-bold">
              الكمية المطلوبة للجملة
            </label>
            <input
              id="bulkThreshold"
              name="bulkThreshold"
              type="number"
              min={1}
              defaultValue={settings.bulkThreshold}
              required
              className={inputClass}
            />
          </div>
        </div>
        <p className="bg-secondary text-muted-foreground rounded-lg p-3 text-xs leading-relaxed">
          القاعدة الحالية: من {settings.bulkThreshold} حبة أو أكثر يصبح سعر الحبة {settings.bulkPrice} دج،
          وأقل من ذلك {settings.unitPrice} دج للحبة.
        </p>

        <div>
          <label htmlFor="storeName" className="mb-1 block text-sm font-bold">
            اسم المتجر
          </label>
          <input id="storeName" name="storeName" defaultValue={settings.storeName} className={inputClass} />
        </div>

        <div>
          <label htmlFor="announcement" className="mb-1 block text-sm font-bold">
            شريط الإعلان في أعلى الموقع
          </label>
          <textarea
            id="announcement"
            name="announcement"
            rows={2}
            defaultValue={settings.announcement}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold transition disabled:opacity-60"
        >
          {pending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>

        {state && (
          <p
            role="status"
            aria-live="polite"
            className={`text-center text-sm font-bold ${state.ok ? 'text-success' : 'text-destructive'}`}
          >
            {state.message}
          </p>
        )}
      </form>

      <form
        action={pwAction}
        className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
      >
        <h2 className="text-lg font-black">تغيير كلمة السر</h2>
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-bold">
            كلمة السر الجديدة
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pwPending}
          className="bg-secondary text-secondary-foreground hover:bg-accent/30 rounded-xl py-3 font-bold transition disabled:opacity-60"
        >
          {pwPending ? 'جاري التغيير...' : 'تغيير كلمة السر'}
        </button>
        {pwState && (
          <p
            role="status"
            aria-live="polite"
            className={`text-center text-sm font-bold ${pwState.ok ? 'text-success' : 'text-destructive'}`}
          >
            {pwState.message}
          </p>
        )}
      </form>
    </div>
  )
}
