import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, watchPosition } = await request.json()

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

  // Check if all lessons in the course are now complete
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
  })

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

    // If all lessons completed, mark enrollment as complete
    if (completedProgress.length >= allLessons.length) {
      await prisma.enrollment.updateMany({
        where: { userId: user.id, courseId: course.id, completedAt: null },
        data: { completedAt: new Date() },
      })
    }
  }

  return NextResponse.json({ success: true })
}
