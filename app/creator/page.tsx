import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CreatorCourseList } from '@/components/creator/CreatorCourseList'

export const dynamic = 'force-dynamic'

export default async function CreatorPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const courses = await prisma.course.findMany({
    where: { creatorId: user.id },
    include: {
      category: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

  // Stats
  const totalStudents = courses.reduce((acc, c) => acc + c._count.enrollments, 0)
  const totalRevenue = await prisma.enrollment.aggregate({
    where: { course: { creatorId: user.id } },
    _sum: { pricePaid: true },
  })
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length
  const revenue = totalRevenue._sum.pricePaid ?? 0

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
