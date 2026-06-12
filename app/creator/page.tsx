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
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.name?.split(' ')[0] ?? 'Creator'}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/creator/analytics"
              className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all"
            >
              Analytics
            </Link>
            <Link
              href="/creator/coupons"
              className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all"
            >
              Coupons
            </Link>
            <Link
              href="/creator/paths"
              className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all"
            >
              Paths
            </Link>
            <Link
              href="/creator/templates"
              className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all"
            >
              Templates
            </Link>
            <Link
              href="/dashboard"
              className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all"
            >
              My Learning
            </Link>
            <Link
              href="/creator/courses/new"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              + New Course
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-4xl font-bold text-foreground mt-2">{courses.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{publishedCourses}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-4xl font-bold text-primary mt-2">{totalStudents}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
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
              <div className="glass-card rounded-2xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">⭐ Top Course</p>
                <div className="flex items-start gap-4">
                  {topCourse.thumbnail ? (
                    <img src={topCourse.thumbnail} className="w-16 h-12 object-cover rounded-lg shrink-0" alt="" />
                  ) : (
                    <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shrink-0 flex items-center justify-center text-white text-xl">📚</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{topCourse.title}</p>
                    <p className="text-muted-foreground text-sm mt-1">{topCourse._count.enrollments} student{topCourse._count.enrollments !== 1 ? 's' : ''}</p>
                    <Link href={`/creator/courses/${topCourse.id}/edit`} className="text-xs text-primary hover:underline mt-1 inline-block">
                      Edit course →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Recent enrollments */}
            {recentEnrollments.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">🎓 Recent Enrollments</p>
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
                          <p className="text-sm font-medium text-foreground truncate">{e.user.name ?? e.user.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.course.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
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
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">My Courses</h2>
            <Link
              href="/creator/courses/new"
              className="text-sm text-primary hover:underline"
            >
              + New Course
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">🎓</p>
              <h3 className="text-lg font-semibold text-foreground mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6">Create your first course and start earning</p>
              <Link
                href="/creator/courses/new"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
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
