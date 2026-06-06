import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendEnrollmentEmails } from '@/lib/email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await request.json()

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: { select: { email: true, name: true } },
      modules: {
        orderBy: { position: 'asc' },
        take: 1,
        include: { lessons: { orderBy: { position: 'asc' }, take: 1, select: { id: true } } },
      },
    },
  })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // For free courses, enroll directly
  // For paid courses, this will go through Stripe in Phase 2
  if (course.price > 0) {
    return NextResponse.json({ error: 'Paid enrollment coming soon' }, { status: 400 })
  }

  const learnerRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  })

  const { enrollment, isNew } = await prisma.$transaction(async (tx) => {
    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })
    if (existing) {
      const updated = await tx.enrollment.update({
        where: { userId_courseId: { userId: user.id, courseId } },
        data: { lastAccessedAt: new Date() },
      })
      return { enrollment: updated, isNew: false }
    }
    const created = await tx.enrollment.create({
      data: { userId: user.id, courseId, pricePaid: 0 },
    })
    return { enrollment: created, isNew: true }
  })

  // Send emails only for new enrollments — fire and forget
  if (isNew && learnerRecord?.email && course.creator.email) {
    const firstLessonId = course.modules[0]?.lessons[0]?.id ?? null
    sendEnrollmentEmails({
      learnerEmail: learnerRecord.email,
      learnerName: learnerRecord.name,
      creatorEmail: course.creator.email,
      creatorName: course.creator.name,
      courseTitle: course.title,
      courseSlug: course.slug,
      firstLessonId,
    }).catch(() => {}) // never let email failure affect the response
  }

  return NextResponse.json({ success: true })
}
