'use client'

import { deleteReview, toggleReview } from '@/app/actions/admin'
import type { Review } from '@/lib/db/schema'
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react'

export function ReviewsPanel({ reviews }: { reviews: Review[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-black">التقييمات ({reviews.length})</h2>

      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li key={review.id} className="bg-card border-border rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{review.name}</p>
                <span className="mt-1 flex items-center gap-0.5" aria-label={`${review.rating} من 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/40'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleReview(review.id, !review.approved)}
                  className="hover:bg-secondary rounded-lg p-2 transition"
                  title={review.approved ? 'إخفاء من الموقع' : 'إظهار في الموقع'}
                >
                  {review.approved ? (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">{review.approved ? 'إخفاء' : 'إظهار'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('حذف هذا التقييم؟')) deleteReview(review.id)
                  }}
                  className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">حذف</span>
                </button>
              </div>
            </div>
            {review.comment && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{review.comment}</p>
            )}
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(review.createdAt).toLocaleString('ar-DZ')}
              {!review.approved && ' — مخفي'}
            </p>
          </li>
        ))}
      </ul>

      {reviews.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">لا توجد تقييمات بعد.</p>
      )}
    </div>
  )
}
