import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await request.json()

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // For free courses, enroll directly
  // For paid courses, this will go through Stripe in Phase 2
  if (course.price > 0) {
    return NextResponse.json({ error: 'Paid enrollment coming soon' }, { status: 400 })
  }

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: { lastAccessedAt: new Date() },
    create: { userId: user.id, courseId, pricePaid: 0 },
  })

  return NextResponse.json({ success: true })
}
