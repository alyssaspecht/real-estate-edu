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

  // Check auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/courses/${slug}`)

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  })
  if (!enrollment) redirect(`/courses/${slug}`)

  // Get current lesson
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) notFound()

  // Get user's progress
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
  })
  const completedLessonIds = new Set(
    progress.filter(p => p.completedAt).map(p => p.lessonId)
  )

  // Update last accessed
  await prisma.enrollment.update({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    data: { lastAccessedAt: new Date() },
  })

  return (
    <LessonPlayer
      course={course}
      currentLesson={lesson}
      completedLessonIds={Array.from(completedLessonIds)}
      userId={user.id}
    />
  )
}
