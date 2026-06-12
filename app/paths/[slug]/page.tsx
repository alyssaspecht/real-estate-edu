import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PathEnrollButton } from '@/components/learner/PathEnrollButton'

export const dynamic = 'force-dynamic'

export default async function PathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const path = await prisma.learningPath.findUnique({
    where: { slug },
    include: {
      creator: { select: { id: true, name: true } },
      courses: {
        orderBy: { position: 'asc' },
        include: {
          course: {
            include: {
              category: { select: { name: true } },
              _count: { select: { enrollments: true } },
              modules: { include: { lessons: { select: { id: true } } } },
            },
          },
        },
      },
    },
  })

  if (!path || !path.published) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check which courses the user is already enrolled in
  let enrolledCourseIds = new Set<string>()
  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id, courseId: { in: path.courses.map(pc => pc.courseId) } },
      select: { courseId: true },
    })
    enrolledCourseIds = new Set(enrollments.map(e => e.courseId))
  }

  const allEnrolled = path.courses.every(pc => enrolledCourseIds.has(pc.courseId))
  const totalValue = path.courses.reduce((s, pc) => s + pc.course.price, 0)
  const savings = totalValue - path.price
  const totalLessons = path.courses.reduce((s, pc) =>
    s + pc.course.modules.reduce((ms, m) => ms + m.lessons.length, 0), 0)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/8 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <Link href="/paths" className="text-sm text-muted-foreground hover:text-foreground mb-4 block">← Learning Paths</Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Learning Path</p>
              <h1 className="text-3xl font-bold text-foreground mb-3">{path.title}</h1>
              {path.description && <p className="text-muted-foreground text-lg mb-4">{path.description}</p>}
              <p className="text-sm text-muted-foreground">
                Created by <Link href={`/creators/${path.creator.id}`} className="text-primary hover:underline">{path.creator.name}</Link>
              </p>
              <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
                <span>📚 {path.courses.length} courses</span>
                <span>🎬 {totalLessons} lessons</span>
              </div>
            </div>

            {/* Enrollment card */}
            <div className="glass-card rounded-2xl p-6 shadow-sm h-fit">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {path.price === 0 ? 'Free' : `$${(path.price / 100).toFixed(2)}`}
                  </span>
                  {savings > 0 && totalValue > 0 && (
                    <div>
                      <span className="text-muted-foreground line-through text-sm block">${(totalValue / 100).toFixed(2)} value</span>
                      <span className="text-green-600 text-xs font-semibold">You save ${(savings / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {allEnrolled ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl text-center">
                    ✅ You're enrolled in all courses
                  </div>
                  <Link href="/dashboard" className="block text-center text-sm text-primary hover:underline">
                    Go to dashboard →
                  </Link>
                </div>
              ) : user ? (
                <PathEnrollButton pathId={path.id} />
              ) : (
                <Link
                  href="/login"
                  className="block w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-center hover:bg-primary/90 transition-colors"
                >
                  Sign in to enroll
                </Link>
              )}

              <p className="text-xs text-muted-foreground text-center mt-3">Enrolls you in all {path.courses.length} courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course list */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        <h2 className="text-xl font-bold text-foreground mb-6">Courses in this path</h2>
        <div className="space-y-4">
          {path.courses.map((pc, i) => {
            const course = pc.course
            const lessonCount = course.modules.reduce((s, m) => s + m.lessons.length, 0)
            const isEnrolled = enrolledCourseIds.has(course.id)
            return (
              <div key={pc.courseId} className="glass-card rounded-2xl p-5 flex gap-5 items-center">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                  {i + 1}
                </div>
                <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl">📚</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    {course.category && <span>{course.category.name}</span>}
                    <span>{lessonCount} lessons</span>
                    <span>{course._count.enrollments} students</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  {isEnrolled && (
                    <span className="text-xs text-green-600 font-medium">✓ Enrolled</span>
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                  </span>
                  <Link href={`/courses/${course.slug}`} className="text-xs text-primary hover:underline">
                    Preview →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
