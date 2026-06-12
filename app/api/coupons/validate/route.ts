import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/coupons/validate — validate a coupon code for a course
export async function POST(req: Request) {
  const { code, courseId } = await req.json()

  if (!code || !courseId) {
    return NextResponse.json({ error: 'Missing code or courseId' }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  })

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 404 })
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 410 })
  }

  // Coupon must apply to this specific course or all of creator's courses
  if (coupon.courseId && coupon.courseId !== courseId) {
    return NextResponse.json({ error: 'Coupon not valid for this course' }, { status: 422 })
  }

  // Verify the creator owns the course
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course || course.creatorId !== coupon.creatorId) {
    return NextResponse.json({ error: 'Coupon not valid for this course' }, { status: 422 })
  }

  // Calculate discounted price
  let finalPrice = course.price
  if (coupon.discountType === 'PERCENT') {
    finalPrice = Math.round(course.price * (1 - coupon.discountValue / 100))
  } else {
    finalPrice = Math.max(0, course.price - coupon.discountValue)
  }

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    originalPrice: course.price,
    finalPrice,
  })
}
