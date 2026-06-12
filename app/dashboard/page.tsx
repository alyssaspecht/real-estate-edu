import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { seedBadges } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ensure badges exist (idempotent)
  await seedBadges()

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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { streak: true },
  })

  // Template purchases
  const templatePurchases = await prisma.templatePurchase.findMany({
    where: { userId: user.id },
    orderBy: { purchasedAt: 'desc' },
    take: 6,
    include: {
      template: {
        include: { category: { select: { name: true, icon: true } } },
      },
    },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {dbUser?.name?.split(' ')[0] ?? 'there'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's your learning progress</p>
          </div>
          <div className="flex gap-3">
            <Link href="/courses" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Browse Courses
            </Link>
            <Link href="/dashboard/profile" className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all">
              My Profile
            </Link>
            {dbUser?.role === 'LEARNER' && (
              <Link href="/dashboard/become-creator" className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Become a Creator
              </Link>
            )}
            {dbUser?.role === 'CREATOR' && (
              <Link href="/creator" className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Creator Dashboard
              </Link>
            )}
            {dbUser?.role === 'ADMIN' && (
              <Link href="/admin" className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="glass-card rounded-2xl p-6 glow-blue">
            <h2 className="text-sm font-medium text-muted-foreground">My Courses</h2>
            <p className="text-4xl font-bold text-primary mt-2">{totalEnrolled}</p>
            <p className="text-sm text-muted-foreground mt-1">Total enrolled</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-medium text-muted-foreground">In Progress</h2>
            <p className="text-4xl font-bold text-orange-400 mt-2">{inProgress}</p>
            <p className="text-sm text-muted-foreground mt-1">Active courses</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-medium text-muted-foreground">Completed</h2>
            <p className="text-4xl font-bold text-green-400 mt-2">{completed}</p>
            <p className="text-sm text-muted-foreground mt-1">Finished courses</p>
          </div>
        </div>

        {/* Gamification strip */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {/* XP */}
          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl shrink-0">⚡</div>
            <div>
              <p className="text-2xl font-bold text-primary">{(dbUser?.xp ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
          </div>
          {/* Streak */}
          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-2xl shrink-0">🔥</div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{dbUser?.streak?.current ?? 0}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </div>
          {/* View full progress */}
          <Link href="/dashboard/progress" className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl shrink-0">🏆</div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">View Progress</p>
              <p className="text-xs text-muted-foreground">Badges & leaderboard →</p>
            </div>
          </Link>
        </div>

        {/* My Courses */}
        {enrollmentsWithProgress.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">My Courses</h2>
            <div className="space-y-4">
              {enrollmentsWithProgress.map((enrollment) => (
                <div key={enrollment.id} className="glass-card rounded-2xl p-6 flex gap-6 items-center hover:border-primary/30 transition-colors">
                  {enrollment.course.thumbnail ? (
                    <img src={enrollment.course.thumbnail} className="w-24 h-16 object-cover rounded-lg shrink-0" alt={enrollment.course.title} />
                  ) : (
                    <div className="w-24 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-lg shrink-0 flex items-center justify-center text-2xl">📚</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{enrollment.course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{enrollment.completedCount} / {enrollment.totalLessons} lessons completed</p>
                    <div className="mt-2 bg-muted rounded-full h-2 w-full">
                      <div
                        className={`h-2 rounded-full transition-all ${enrollment.isCompleted ? 'bg-green-400' : 'bg-primary'}`}
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {enrollment.isCompleted ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-block bg-green-400/10 text-green-400 text-xs font-medium px-2 py-1 rounded-full border border-green-400/20">✅ Completed</span>
                        {enrollment.course.hasCertificate && (
                          <Link href={`/courses/${enrollment.course.slug}/certificate`} className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                            🎓 Certificate
                          </Link>
                        )}
                        <Link href={`/courses/${enrollment.course.slug}`} className="text-xs text-muted-foreground hover:text-foreground">Review course</Link>
                      </div>
                    ) : (
                      <Link href={`/courses/${enrollment.course.slug}/lessons/${enrollment.continueLesson?.id}`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                        {enrollment.completedCount > 0 ? 'Continue →' : 'Start →'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🎓</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Browse our catalog and start learning today</p>
            <Link href="/courses" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Browse Courses
            </Link>
          </div>
        )}

        {/* My Downloads */}
        {templatePurchases.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">My Downloads</h2>
              <Link href="/templates" className="text-sm text-primary hover:underline">
                Browse more →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {templatePurchases.map(p => (
                <div key={p.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                    {p.template.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.template.title}</p>
                    <p className="text-xs text-muted-foreground">{p.template.category.name}</p>
                  </div>
                  <a
                    href={`/api/templates/${p.template.slug}/download`}
                    className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0"
                  >
                    ⬇️ Get
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
