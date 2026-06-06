import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all enrollments with course and progress data
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: 'desc' },
  })

  // Get completed lesson IDs for this user
  const completedProgress = await prisma.lessonProgress.findMany({
    where: { userId: user.id, completedAt: { not: null } },
    select: { lessonId: true },
  })
  const completedLessonIds = new Set(completedProgress.map(p => p.lessonId))

  // Calculate stats per enrollment
  const enrollmentsWithProgress = enrollments.map(enrollment => {
    const allLessons = enrollment.course.modules.flatMap(m => m.lessons)
    const totalLessons = allLessons.length
    const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length
    const isCompleted = totalLessons > 0 && completedCount === totalLessons
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    // Find first incomplete lesson for "continue" link
    const firstIncomplete = allLessons.find(l => !completedLessonIds.has(l.id))
    const continueLesson = firstIncomplete ?? allLessons[allLessons.length - 1]

    return {
      ...enrollment,
      totalLessons,
      completedCount,
      isCompleted,
      progressPercent,
      continueLesson,
    }
  })

  const totalEnrolled = enrollmentsWithProgress.length
  const inProgress = enrollmentsWithProgress.filter(e => e.completedCount > 0 && !e.isCompleted).length
  const completed = enrollmentsWithProgress.filter(e => e.isCompleted).length

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {dbUser?.name?.split(' ')[0] ?? 'there'}! 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's your learning progress</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/courses"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Browse Courses
            </Link>
            <Link
              href="/dashboard/profile"
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              My Profile
            </Link>
            {dbUser?.role === 'LEARNER' && (
              <Link
                href="/dashboard/become-creator"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Become a Creator
              </Link>
            )}
            {dbUser?.role === 'CREATOR' && (
              <Link
                href="/creator"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Creator Dashboard
              </Link>
            )}
            {(dbUser?.role === 'ADMIN') && (
              <Link
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500">My Courses</h2>
            <p className="text-4xl font-bold text-blue-600 mt-2">{totalEnrolled}</p>
            <p className="text-sm text-gray-400 mt-1">Total enrolled</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500">In Progress</h2>
            <p className="text-4xl font-bold text-orange-500 mt-2">{inProgress}</p>
            <p className="text-sm text-gray-400 mt-1">Active courses</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500">Completed</h2>
            <p className="text-4xl font-bold text-green-500 mt-2">{completed}</p>
            <p className="text-sm text-gray-400 mt-1">Finished courses</p>
          </div>
        </div>

        {/* My Courses */}
        {enrollmentsWithProgress.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Courses</h2>
            <div className="space-y-4">
              {enrollmentsWithProgress.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex gap-6 items-center"
                >
                  {/* Thumbnail */}
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      className="w-24 h-16 object-cover rounded-lg shrink-0"
                      alt={enrollment.course.title}
                    />
                  ) : (
                    <div className="w-24 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shrink-0 flex items-center justify-center text-2xl">
                      📚
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{enrollment.course.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {enrollment.completedCount} / {enrollment.totalLessons} lessons completed
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 bg-gray-100 rounded-full h-2 w-full">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          enrollment.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Status + CTA */}
                  <div className="shrink-0 text-right">
                    {enrollment.isCompleted ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          ✅ Completed
                        </span>
                        {enrollment.course.hasCertificate && (
                          <Link
                            href={`/courses/${enrollment.course.slug}/certificate`}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            🎓 View Certificate
                          </Link>
                        )}
                        <Link
                          href={`/courses/${enrollment.course.slug}`}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Review course
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/courses/${enrollment.course.slug}/lessons/${enrollment.continueLesson?.id}`}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        {enrollment.completedCount > 0 ? 'Continue →' : 'Start →'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-4">🎓</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-6">Browse our catalog and start learning today</p>
            <Link
              href="/courses"
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
