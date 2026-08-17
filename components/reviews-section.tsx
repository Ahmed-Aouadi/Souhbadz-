'use client'

import { submitReview } from '@/app/actions/store'
import type { Review } from '@/lib/db/schema'
import { Star } from 'lucide-react'
import { useState } from 'react'

function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} من 5 نجوم`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${star <= value ? 'fill-accent text-accent' : 'text-muted-foreground/40'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, setPending] = useState(false)

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    const result = await submitReview({ name, rating, comment })
    setPending(false)
    setStatus(result)
    if (result.ok) {
      setName('')
      setComment('')
      setRating(5)
    }
  }

  return (
    <section id="reviews" className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black">تقييمات الزبائن</h2>
        {reviews.length > 0 ? (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Stars value={Math.round(average)} className="h-5 w-5" />
            <span className="font-bold">{average}</span>
            <span className="text-muted-foreground text-sm">({reviews.length} تقييم)</span>
          </div>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm">كن أول من يقيّم خدمتنا</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {reviews.length === 0 && (
            <p className="text-muted-foreground bg-card border-border rounded-xl border p-6 text-center text-sm">
              لا توجد تقييمات بعد.
            </p>
          )}
          {reviews.map((review) => (
            <article key={review.id} className="bg-card border-border rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{review.name}</p>
                <Stars value={review.rating} />
              </div>
              {review.comment && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{review.comment}</p>
              )}
              <p className="text-muted-foreground mt-2 text-xs">
                {new Date(review.createdAt).toLocaleDateString('ar-DZ')}
              </p>
            </article>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border-border flex h-fit flex-col gap-4 rounded-2xl border p-5 shadow-sm"
        >
          <h3 className="text-lg font-bold">أضف تقييمك</h3>

          <div>
            <span className="mb-1 block text-sm font-bold">تقييمك</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-7 w-7 transition ${
                      star <= (hover || rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground/40'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{star} نجوم</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reviewName" className="mb-1 block text-sm font-bold">
              اسمك
            </label>
            <input
              id="reviewName"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: سارة"
              className="border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="reviewComment" className="mb-1 block text-sm font-bold">
              تعليقك
            </label>
            <textarea
              id="reviewComment"
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="شاركنا تجربتك مع بروشات SouhbaDz"
              className="border-input focus:border-accent focus:ring-ring/30 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-bold transition disabled:opacity-60"
          >
            {pending ? 'جاري الإرسال...' : 'نشر التقييم'}
          </button>

          {status && (
            <p
              role="status"
              aria-live="polite"
              className={`text-center text-sm font-bold ${status.ok ? 'text-success' : 'text-destructive'}`}
            >
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
