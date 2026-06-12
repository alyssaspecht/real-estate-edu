import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

// POST /api/coupons — creator creates a coupon
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { code, discountType, discountValue, courseId, expiresAt } = body

  if (!code || !discountType || discountValue == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['PERCENT', 'FIXED'].includes(discountType)) {
    return NextResponse.json({ error: 'Invalid discountType' }, { status: 400 })
  }
  if (discountType === 'PERCENT' && (discountValue < 1 || discountValue > 100)) {
    return NextResponse.json({ error: 'Percent must be 1–100' }, { status: 400 })
  }

  // If courseId provided, verify the course belongs to this creator
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.creatorId !== user.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        creatorId: user.id,
        courseId: courseId || null,
        code: code.toUpperCase().trim(),
        discountType,
        discountValue,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    return NextResponse.json(coupon, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Code already exists' }, { status: 409 })
  }
}

// GET /api/coupons — creator lists their coupons
export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coupons = await prisma.coupon.findMany({
    where: { creatorId: user.id },
    include: { course: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(coupons)
}

// PATCH /api/coupons — toggle active/inactive
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, active } = await req.json()
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon || coupon.creatorId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.coupon.update({ where: { id }, data: { active } })
  return NextResponse.json(updated)
}

// DELETE /api/coupons
export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon || coupon.creatorId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
