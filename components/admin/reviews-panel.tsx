'use client'

import { deleteReview, toggleReview, updateReview } from '@/app/actions/admin'
import type { Review } from '@/lib/db/schema'
import { Check, Eye, EyeOff, Pencil, Search, Star, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export function ReviewsPanel({ reviews }: { reviews: Review[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'visible' | 'hidden'>('all')
  const [rating, setRating] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [editing, setEditing] = useState<Review | null>(null)
  const [saving, setSaving] = useState(false)

  const visibleReviews = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reviews.filter((review) => {
      const matchesQuery = !q || [review.name, review.comment].join(' ').toLowerCase().includes(q)
      const matchesStatus = status === 'all' || (status === 'visible' ? review.approved : !review.approved)
      const matchesRating = rating === 'all' || review.rating === Number(rating)
      return matchesQuery && matchesStatus && matchesRating
    })
  }, [reviews, query, status, rating])

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    const form = new FormData(event.currentTarget)
    setSaving(true)
    const result = await updateReview(editing.id, {
      name: String(form.get('name') ?? ''),
      rating: Number(form.get('rating') ?? 5),
      comment: String(form.get('comment') ?? ''),
    })
    setSaving(false)
    if (result.ok) setEditing(null)
    else alert(result.message)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black">إدارة التقييمات والتعليقات ({reviews.length})</h2>
          <p className="text-muted-foreground mt-1 text-xs">تعديل، إظهار، إخفاء أو حذف تعليقات الزبائن.</p>
        </div>
        <div className="text-muted-foreground text-xs font-bold">{visibleReviews.length} نتيجة</div>
      </div>

      <div className="bg-card border-border grid gap-2 rounded-2xl border p-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم أو التعليق..."
            className="border-input w-full rounded-xl border bg-background py-2.5 pr-9 pl-3 text-sm outline-none focus:border-accent" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
          className="border-input rounded-xl border bg-background px-3 py-2.5 text-sm font-bold">
          <option value="all">كل الحالات</option><option value="visible">ظاهر</option><option value="hidden">مخفي</option>
        </select>
        <select value={rating} onChange={(e) => setRating(e.target.value as typeof rating)}
          className="border-input rounded-xl border bg-background px-3 py-2.5 text-sm font-bold">
          <option value="all">كل النجوم</option>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} نجوم</option>)}
        </select>
      </div>

      <ul className="flex flex-col gap-3">
        {visibleReviews.map((review) => (
          <li key={review.id} className="bg-card border-border rounded-2xl border p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black">{review.name}</p>
                <span className="mt-1 flex items-center gap-0.5" aria-label={`${review.rating} من 5`}>
                  {[1,2,3,4,5].map(star => <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} aria-hidden="true" />)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setEditing(review)} className="hover:bg-secondary rounded-lg p-2" title="تعديل">
                  <Pencil className="h-4 w-4" /><span className="sr-only">تعديل</span>
                </button>
                <button type="button" onClick={() => toggleReview(review.id, !review.approved)}
                  className="hover:bg-secondary rounded-lg p-2" title={review.approved ? 'إخفاء من الموقع' : 'إظهار في الموقع'}>
                  {review.approved ? <Eye className="h-4 w-4" /> : <EyeOff className="text-muted-foreground h-4 w-4" />}
                  <span className="sr-only">{review.approved ? 'إخفاء' : 'إظهار'}</span>
                </button>
                <button type="button" onClick={() => { if (confirm('حذف هذا التقييم نهائياً؟')) deleteReview(review.id) }}
                  className="text-destructive hover:bg-destructive/10 rounded-lg p-2" title="حذف">
                  <Trash2 className="h-4 w-4" /><span className="sr-only">حذف</span>
                </button>
              </div>
            </div>
            {review.comment && <p className="text-muted-foreground mt-3 rounded-xl bg-secondary/50 p-3 text-sm leading-relaxed">{review.comment}</p>}
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(review.createdAt).toLocaleString('ar-DZ')} · {review.approved ? 'ظاهر للزبائن' : 'مخفي'}
            </p>
          </li>
        ))}
      </ul>

      {visibleReviews.length === 0 && <p className="text-muted-foreground bg-card border-border rounded-2xl border p-8 text-center text-sm">لا توجد تعليقات مطابقة للفلاتر.</p>}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
          <form onSubmit={saveEdit} className="bg-background w-full max-w-lg rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black">تعديل التقييم والتعليق</h3>
              <button type="button" onClick={() => setEditing(null)} className="bg-secondary rounded-full p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold">اسم الزبون<input name="name" defaultValue={editing.name} maxLength={60} required className="border-input mt-1 w-full rounded-xl border px-3 py-3 outline-none focus:border-accent" /></label>
              <label className="text-sm font-bold">التقييم
                <select name="rating" defaultValue={editing.rating} className="border-input mt-1 w-full rounded-xl border px-3 py-3">
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} نجوم</option>)}
                </select>
              </label>
              <label className="text-sm font-bold">التعليق<textarea name="comment" defaultValue={editing.comment} maxLength={600} rows={5} className="border-input mt-1 w-full resize-none rounded-xl border px-3 py-3 outline-none focus:border-accent" /></label>
              <button disabled={saving} className="bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-xl py-3 font-black disabled:opacity-50">
                <Check className="h-4 w-4" />{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
