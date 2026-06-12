import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CreatorAnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) notFound()

  const courses = await prisma.course.findMany({
    where: { creatorId: user.id },
    include: {
      enrollments: { select: { purchasedAt: true, completedAt: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Build monthly enrollment trend for last 6 months
  const now = new Date()
  const months: { label: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      start: d,
      end,
    })
  }

  const allEnrollments = courses.flatMap(c => c.enrollments)
  const trend = months.map(m => ({
    label: m.label,
    count: allEnrollments.filter(e =>
      new Date(e.purchasedAt) >= m.start && new Date(e.purchasedAt) <= m.end
    ).length,
  }))

  const maxTrend = Math.max(...trend.map(t => t.count), 1)

  // Per-course stats
  const courseStats = courses.map(c => {
    const totalEnrollments = c.enrollments.length
    const completed = c.enrollments.filter(e => e.completedAt).length
    const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0
    const avgRating = c.reviews.length > 0
      ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
      : null
    return { ...c, totalEnrollments, completed, completionRate, avgRating }
  })

  // Platform-wide summary
  const totalEnrollments = allEnrollments.length
  const totalCompleted = allEnrollments.filter(e => e.completedAt).length
  const overallCompletion = totalEnrollments > 0 ? Math.round((totalCompleted / totalEnrollments) * 100) : 0
  const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating))
  const overallRating = allRatings.length > 0
    ? allRatings.reduce((s, r) => s + r, 0) / allRatings.length
    : null

  const topCourse = courseStats.length > 0
    ? [...courseStats].sort((a, b) => b.totalEnrollments - a.totalEnrollments)[0]
    : null

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">← Creator Dashboard</Link>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Performance overview for your courses</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-4xl font-bold text-foreground mt-2">{courses.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
            <p className="text-4xl font-bold text-primary mt-2">{totalEnrollments}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{overallCompletion}%</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-4xl font-bold text-yellow-500 mt-2">
              {overallRating !== null ? overallRating.toFixed(1) : '—'}
            </p>
            {allRatings.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{allRatings.length} review{allRatings.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {/* Enrollment trend */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-6">Enrollment Trend — Last 6 Months</h2>
          {totalEnrollments === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No enrollments yet</p>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {trend.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                    <div
                      className="w-full bg-primary/100 rounded-t-lg transition-all"
                      style={{ height: `${Math.max((m.count / maxTrend) * 96, m.count > 0 ? 8 : 2)}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top course callout */}
        {topCourse && topCourse.totalEnrollments > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-center gap-6">
            <span className="text-4xl">⭐</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Top Performing Course</p>
              <p className="font-semibold text-foreground text-lg">{topCourse.title}</p>
              <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                <span>{topCourse.totalEnrollments} student{topCourse.totalEnrollments !== 1 ? 's' : ''}</span>
                <span>{topCourse.completionRate}% completion</span>
                {topCourse.avgRating && <span>★ {topCourse.avgRating.toFixed(1)}</span>}
              </div>
            </div>
            <Link
              href={`/creator/courses/${topCourse.id}/edit`}
              className="text-sm text-primary hover:underline shrink-0"
            >
              Edit course →
            </Link>
          </div>
        )}

        {/* Per-course table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Course Breakdown</h2>
          </div>
          {courseStats.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No courses yet. <Link href="/creator/courses/new" className="text-primary hover:underline">Create your first course</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted border-b border-border">
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Enrollments</th>
                  <th className="px-6 py-3">Completions</th>
                  <th className="px-6 py-3">Completion Rate</th>
                  <th className="px-6 py-3">Avg Rating</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courseStats.map((course) => (
                  <tr key={course.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground text-sm line-clamp-1">{course.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {course.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{course.totalEnrollments}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{course.completed}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{course.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {course.avgRating !== null ? (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          {course.avgRating.toFixed(1)}
                          <span className="text-muted-foreground text-xs">({course.reviews.length})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">No reviews</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link href={`/creator/courses/${course.id}/students`} className="text-xs text-primary hover:underline">Students</Link>
                        <Link href={`/creator/courses/${course.id}/edit`} className="text-xs text-muted-foreground hover:text-foreground">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
