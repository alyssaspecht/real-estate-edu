import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { onLessonComplete, onCourseComplete } from '@/lib/gamification'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, watchPosition } = await request.json()

  // Check if already completed (to avoid double XP)
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  })
  const alreadyCompleted = !!existing?.completedAt

  // Mark lesson complete
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {
      completedAt: new Date(),
      watchPositionSeconds: watchPosition ?? 0,
    },
    create: {
      userId: user.id,
      lessonId,
      completedAt: new Date(),
      watchPositionSeconds: watchPosition ?? 0,
    },
  })

  // Gamification (only on first completion)
  let gamification = null
  if (!alreadyCompleted) {
    gamification = await onLessonComplete(user.id)
  }

  // Check if all lessons in the course are now complete
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
  })

  let courseGamification = null
  if (lesson) {
    const course = lesson.module.course
    const allLessons = course.modules.flatMap(m => m.lessons)

    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        lessonId: { in: allLessons.map(l => l.id) },
        completedAt: { not: null },
      },
    })

    if (completedProgress.length >= allLessons.length) {
      // Mark enrollment complete
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: user.id, courseId: course.id, completedAt: null },
      })
      if (enrollment) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { completedAt: new Date() },
        })
        courseGamification = await onCourseComplete(user.id)
      }
    }
  }

  return NextResponse.json({
    success: true,
    gamification,
    courseGamification,
  })
}
