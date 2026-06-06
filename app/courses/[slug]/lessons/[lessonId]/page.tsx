import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LessonPlayer } from '@/components/learner/LessonPlayer'

export const dynamic = 'force-dynamic'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { slug, lessonId } = await params

  // Get course with all modules and lessons
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: { lessons: { orderBy: { position: 'asc' } } },
      },
    },
  })

  if (!course) notFound()

  // Get current lesson first so we can check isFreePreview
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) notFound()

  // Check auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Free preview lessons are accessible without login or enrollment
  const isPreview = lesson.isFreePreview

  if (!isPreview) {
    if (!user) redirect(`/courses/${slug}`)
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    })
    if (!enrollment) redirect(`/courses/${slug}`)
  }

  // Get user's progress (only if logged in)
  let completedLessonIds: string[] = []
  if (user) {
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: user.id },
    })
    completedLessonIds = progress.filter(p => p.completedAt).map(p => p.lessonId)

    // Update last accessed (only for enrolled users)
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    })
    if (enrollment) {
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        data: { lastAccessedAt: new Date() },
      })
    }
  }

  return (
    <LessonPlayer
      course={course}
      currentLesson={lesson}
      completedLessonIds={completedLessonIds}
      userId={user?.id ?? null}
    />
  )
}
