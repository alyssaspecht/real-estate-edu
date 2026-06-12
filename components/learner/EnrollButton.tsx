'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  courseId: string
  slug: string
  firstLessonId: string | null
  price: number
}

type CouponResult = {
  valid: boolean
  couponId: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  originalPrice: number
  finalPrice: number
}

export function EnrollButton({ courseId, slug, firstLessonId, price }: Props) {
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [couponError, setCouponError] = useState('')
  const [validating, setValidating] = useState(false)
  const router = useRouter()

  const effectivePrice = couponResult ? couponResult.finalPrice : price

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError('')
    setCouponResult(null)
    setValidating(true)

    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, courseId }),
    })

    setValidating(false)
    if (res.ok) {
      const data = await res.json()
      setCouponResult(data)
    } else {
      const data = await res.json()
      setCouponError(data.error ?? 'Invalid coupon')
    }
  }

  const handleRemoveCoupon = () => {
    setCouponResult(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleEnroll = async () => {
    setLoading(true)

    // Free course (or coupon makes it free) — enroll directly
    if (effectivePrice === 0) {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, couponCode: couponResult?.code }),
      })
      if (res.ok && firstLessonId) {
        router.push(`/courses/${slug}/lessons/${firstLessonId}`)
      } else {
        setLoading(false)
      }
      return
    }

    // Paid course — go through Stripe Checkout
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'course', courseId, couponCode: couponResult?.code }),
    })

    const data = await res.json()

    if (data.free) {
      // Coupon reduced to $0 server-side
      const enrollRes = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, couponCode: couponResult?.code }),
      })
      if (enrollRes.ok && firstLessonId) {
        router.push(`/courses/${slug}/lessons/${firstLessonId}`)
      } else {
        setLoading(false)
      }
      return
    }

    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Coupon input — only show for paid courses */}
      {price > 0 && (
        <div>
          {couponResult ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div>
                <span className="text-sm font-semibold text-green-700">{couponResult.code} applied</span>
                <span className="text-xs text-green-600 ml-2">
                  {couponResult.discountType === 'PERCENT'
                    ? `${couponResult.discountValue}% off`
                    : `$${(couponResult.discountValue / 100).toFixed(2)} off`}
                </span>
              </div>
              <button onClick={handleRemoveCoupon} className="text-xs text-green-600 hover:text-green-800 underline">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={validating || !couponCode.trim()}
                className="bg-muted text-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {validating ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
        </div>
      )}

      {/* Price display */}
      {couponResult && couponResult.finalPrice < couponResult.originalPrice && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground line-through text-sm">${(couponResult.originalPrice / 100).toFixed(2)}</span>
          <span className="text-2xl font-bold text-foreground">
            {couponResult.finalPrice === 0 ? 'Free' : `$${(couponResult.finalPrice / 100).toFixed(2)}`}
          </span>
        </div>
      )}

      {/* Enroll button */}
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading
          ? 'Enrolling...'
          : effectivePrice === 0
          ? 'Enroll for Free'
          : `Enroll — $${(effectivePrice / 100).toFixed(2)}`}
      </button>
    </div>
  )
}
