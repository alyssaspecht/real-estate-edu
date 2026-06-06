import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/reviews — create or update a review
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, rating, body } = await request.json()

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  // Cannot review your own course
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (course?.creatorId === user.id) {
    return NextResponse.json({ error: 'Cannot review your own course' }, { status: 403 })
  }

  const review = await prisma.review.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: { rating, body: body ?? null },
    create: { userId: user.id, courseId, rating, body: body ?? null },
    include: { user: { select: { name: true, avatarUrl: true } } },
  })

  return NextResponse.json({ review })
}
