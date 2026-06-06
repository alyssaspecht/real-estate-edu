import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EnrollButton } from '@/components/learner/EnrollButton'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const course = await prisma.course.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      creator: { include: { profile: true } },
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: { orderBy: { position: 'asc' } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) notFound()

  // Check if current user is enrolled
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isEnrolled = false
  let firstLessonId = null

  if (user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    })
    isEnrolled = !!enrollment
  }

  // Find first lesson
  const firstModule = course.modules[0]
  if (firstModule?.lessons[0]) {
    firstLessonId = firstModule.lessons[0].id
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12 flex gap-12 items-start">
          <div className="flex-1">
            {course.category && (
              <span className="text-blue-400 text-sm font-medium">
                {course.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold mt-2 mb-4">{course.title}</h1>
            {course.description && (
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>📚 {course.modules.length} modules</span>
              <span>🎬 {totalLessons} lessons</span>
              <span>👥 {course._count.enrollments} students</span>
            </div>
          </div>

          {/* Enrollment card */}
          <div className="w-80 bg-white rounded-2xl p-6 text-gray-900 shrink-0">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                className="w-full h-40 object-cover rounded-lg mb-4"
                alt={course.title}
              />
            )}
            <p className="text-3xl font-bold mb-4">
              {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
            </p>

            {isEnrolled ? (
              <Link
                href={`/courses/${slug}/lessons/${firstLessonId}`}
                className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Continue Learning →
              </Link>
            ) : user ? (
              <EnrollButton courseId={course.id} slug={slug} firstLessonId={firstLessonId} price={course.price} />
            ) : (
              <Link
                href="/login"
                className="block w-full bg-gray-900 text-white text-center py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Sign in to Enroll
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Instructor */}
      <div className="max-w-6xl mx-auto px-8 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Instructor</h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {course.creator.avatarUrl ? (
              <img src={course.creator.avatarUrl} alt={course.creator.name ?? ''} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              (course.creator.name?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/creators/${course.creator.id}`} className="font-semibold text-gray-900 hover:text-blue-600 hover:underline text-lg">
              {course.creator.name ?? 'Instructor'}
            </Link>
            {course.creator.profile?.headline && (
              <p className="text-gray-500 text-sm mt-0.5">{course.creator.profile.headline}</p>
            )}
            {course.creator.profile?.bio && (
              <p className="text-gray-600 mt-3 leading-relaxed">{course.creator.profile.bio}</p>
            )}
            <Link href={`/creators/${course.creator.id}`} className="inline-block mt-3 text-sm text-blue-600 hover:underline">
              View all courses by {course.creator.name?.split(' ')[0] ?? 'instructor'} →
            </Link>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
        <div className="space-y-3">
          {course.modules.map((module) => (
            <div key={module.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{module.lessons.length} lessons</p>
              </div>
              <div className="divide-y divide-gray-50">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-sm">
                      {lesson.type === 'VIDEO' ? '🎬' : lesson.type === 'TEXT' ? '📝' : '📎'}
                    </span>
                    <span className="flex-1 text-sm text-gray-700">{lesson.title}</span>
                    {lesson.durationSeconds && (
                      <span className="text-xs text-gray-400">
                        {Math.floor(lesson.durationSeconds / 60)}:{String(lesson.durationSeconds % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
