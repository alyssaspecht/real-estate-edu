import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getUser'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CourseStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) notFound()

  const course = await prisma.course.findUnique({
    where: { id, creatorId: user.id },
    include: {
      enrollments: {
        orderBy: { purchasedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
  })

  if (!course) notFound()

  // Total lesson count for progress calc
  const allLessonIds = new Set(course.modules.flatMap(m => m.lessons.map(l => l.id)))
  const totalLessons = allLessonIds.size

  // Get progress for all enrolled users in this course
  const enrolledUserIds = course.enrollments.map(e => e.userId)
  const progressRecords = await prisma.lessonProgress.findMany({
    where: {
      userId: { in: enrolledUserIds },
      lessonId: { in: [...allLessonIds] },
      completedAt: { not: null },
    },
    select: { userId: true, lessonId: true },
  })

  // Group completed lessons by user
  const completedByUser = new Map<string, Set<string>>()
  for (const p of progressRecords) {
    if (!completedByUser.has(p.userId)) completedByUser.set(p.userId, new Set())
    completedByUser.get(p.userId)!.add(p.lessonId)
  }

  const students = course.enrollments.map(enrollment => {
    const completedCount = completedByUser.get(enrollment.userId)?.size ?? 0
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    const isCompleted = totalLessons > 0 && completedCount === totalLessons
    return { ...enrollment, completedCount, progressPercent, isCompleted }
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/creator/courses/${id}/edit`} className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
            ← Back to editor
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
              <p className="text-muted-foreground mt-0.5">Students enrolled</p>
            </div>
            <div className="glass-card rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-bold text-primary">{students.length}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Total students</p>
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">👥</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">No students yet</h3>
            <p className="text-muted-foreground mb-6">
              {course.status === 'DRAFT'
                ? 'Publish your course so learners can enroll.'
                : 'Share your course to start getting students.'}
            </p>
            {course.status === 'DRAFT' && (
              <Link
                href={`/creator/courses/${id}/edit`}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Go to editor
              </Link>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Student
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Enrolled
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Progress
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => {
                  const initials = student.user.name
                    ? student.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : (student.user.email?.[0] ?? '?').toUpperCase()

                  return (
                    <tr key={student.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {student.user.name ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(student.purchasedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-2 w-24">
                            <div
                              className={`h-2 rounded-full ${student.isCompleted ? 'bg-green-500' : 'bg-primary/100'}`}
                              style={{ width: `${student.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {student.completedCount}/{totalLessons}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.isCompleted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Completed
                          </span>
                        ) : student.completedCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Not Started
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
