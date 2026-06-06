import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CreatorCourseList } from '@/components/creator/CreatorCourseList'

export const dynamic = 'force-dynamic'

export default async function CreatorPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const [courses, recentEnrollments, totalRevenue] = await Promise.all([
    prisma.course.findMany({
      where: { creatorId: user.id },
      include: {
        category: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enrollment.findMany({
      where: { course: { creatorId: user.id } },
      orderBy: { purchasedAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true, slug: true } },
      },
    }),
    prisma.enrollment.aggregate({
      where: { course: { creatorId: user.id } },
      _sum: { pricePaid: true },
    }),
  ])

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

  // Stats
  const totalStudents = courses.reduce((acc, c) => acc + c._count.enrollments, 0)
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length
  const revenue = totalRevenue._sum.pricePaid ?? 0

  // Top course by enrollments
  const topCourse = courses.length > 0
    ? [...courses].sort((a, b) => b._count.enrollments - a._count.enrollments)[0]
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user.name?.split(' ')[0] ?? 'Creator'}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              My Learning
            </Link>
            <Link
              href="/creator/courses/new"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              + New Course
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{courses.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{publishedCourses}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">
              ${(revenue / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Top course + Recent enrollments */}
        {(topCourse || recentEnrollments.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Top course */}
            {topCourse && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⭐ Top Course</p>
                <div className="flex items-start gap-4">
                  {topCourse.thumbnail ? (
                    <img src={topCourse.thumbnail} className="w-16 h-12 object-cover rounded-lg shrink-0" alt="" />
                  ) : (
                    <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shrink-0 flex items-center justify-center text-white text-xl">📚</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">{topCourse.title}</p>
                    <p className="text-gray-500 text-sm mt-1">{topCourse._count.enrollments} student{topCourse._count.enrollments !== 1 ? 's' : ''}</p>
                    <Link href={`/creator/courses/${topCourse.id}/edit`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                      Edit course →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Recent enrollments */}
            {recentEnrollments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🎓 Recent Enrollments</p>
                <div className="space-y-3">
                  {recentEnrollments.map((e) => {
                    const initials = e.user.name
                      ? e.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : (e.user.email?.[0] ?? '?').toUpperCase()
                    return (
                      <div key={e.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{e.user.name ?? e.user.email}</p>
                          <p className="text-xs text-gray-400 truncate">{e.course.title}</p>
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">
                          {new Date(e.purchasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Courses */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Courses</h2>
            <Link
              href="/creator/courses/new"
              className="text-sm text-blue-600 hover:underline"
            >
              + New Course
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">🎓</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Create your first course and start earning</p>
              <Link
                href="/creator/courses/new"
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Create Your First Course
              </Link>
            </div>
          ) : (
            <CreatorCourseList courses={courses} />
          )}
        </div>
      </div>
    </div>
  )
}
