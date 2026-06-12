'use client'

import { useState } from 'react'

type Review = {
  id: string
  rating: number
  body: string | null
  createdAt: string
  user: { name: string | null; avatarUrl: string | null }
}

type Props = {
  courseId: string
  reviews: Review[]
  averageRating: number
  isEnrolled: boolean
  isCreator: boolean
  existingReview: Review | null
}

function Stars({ rating, size = 'sm', interactive = false, onChange }: {
  rating: number
  size?: 'sm' | 'lg'
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || rating) : rating
  const sz = size === 'lg' ? 'text-2xl' : 'text-sm'

  return (
    <div className={`flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          {star <= display ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

export function ReviewSection({ courseId, reviews: initialReviews, averageRating, isEnrolled, isCreator, existingReview }: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [avg, setAvg] = useState(averageRating)
  const [myReview, setMyReview] = useState(existingReview)
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [body, setBody] = useState(existingReview?.body ?? '')
  const [editing, setEditing] = useState(!existingReview && isEnrolled && !isCreator)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!rating) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, rating, body: body.trim() || null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setSubmitting(false); return }

    const updated = data.review
    setMyReview(updated)
    setEditing(false)
    setReviews(prev => {
      const without = prev.filter(r => r.id !== updated.id)
      const next = [updated, ...without]
      const newAvg = next.reduce((s, r) => s + r.rating, 0) / next.length
      setAvg(newAvg)
      return next
    })
    setSubmitting(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="flex items-center gap-6 mb-8">
        <h2 className="text-2xl font-bold text-foreground">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-foreground">{avg.toFixed(1)}</span>
            <div>
              <Stars rating={Math.round(avg)} size="lg" />
              <p className="text-sm text-muted-foreground mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Write / edit review */}
      {isEnrolled && !isCreator && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          {myReview && !editing ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-foreground text-sm">Your review</p>
                <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">Edit</button>
              </div>
              <Stars rating={myReview.rating} />
              {myReview.body && <p className="text-foreground text-sm mt-2">{myReview.body}</p>}
            </div>
          ) : editing ? (
            <div>
              <p className="font-semibold text-foreground mb-3">{myReview ? 'Edit your review' : 'Leave a review'}</p>
              <Stars rating={rating} size="lg" interactive onChange={setRating} />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your experience (optional)…"
                rows={3}
                className="mt-3 w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving…' : 'Submit Review'}
                </button>
                {myReview && (
                  <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">No reviews yet.{isEnrolled && !isCreator ? ' Be the first!' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const initials = review.user.name
              ? review.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : '?'
            return (
              <div key={review.id} className="glass-card rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-foreground text-sm">{review.user.name ?? 'Anonymous'}</span>
                      <Stars rating={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {review.body && <p className="text-foreground text-sm leading-relaxed">{review.body}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
