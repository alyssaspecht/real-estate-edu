import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { seedBadges } from '@/lib/gamification'
import { XPBar } from '@/components/gamification/XPBar'
import { StreakWidget } from '@/components/gamification/StreakWidget'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { Leaderboard } from '@/components/gamification/Leaderboard'

export const dynamic = 'force-dynamic'

export default async function ProgressPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Ensure badges are seeded (idempotent)
  await seedBadges()

  const [dbUser, allBadges, userBadges, topUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, streak: true },
    }),
    prisma.badge.findMany({ orderBy: [{ category: 'asc' }, { threshold: 'asc' }] }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    }),
    prisma.user.findMany({
      where: { xp: { gt: 0 } },
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        xp: true,
        _count: { select: { enrollments: true } },
      },
    }),
  ])

  const earnedSlugs = new Set(userBadges.map(ub => ub.badge.slug))
  const badges = allBadges.map(b => ({
    ...b,
    earned: earnedSlugs.has(b.slug),
    earnedAt: userBadges.find(ub => ub.badge.slug === b.slug)?.earnedAt?.toISOString() ?? null,
  }))

  const currentUserRank = dbUser?.xp
    ? (await prisma.user.count({ where: { xp: { gt: dbUser.xp } } })) + 1
    : null

  const xp = dbUser?.xp ?? 0
  const streak = dbUser?.streak ?? null

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
          <p className="text-muted-foreground mt-1">Track your learning journey, streaks, and achievements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <XPBar xp={xp} />
            <StreakWidget
              current={streak?.current ?? 0}
              longest={streak?.longest ?? 0}
            />
            <BadgeGrid badges={badges} />
          </div>

          {/* Right column */}
          <div>
            <Leaderboard
              topUsers={topUsers}
              currentUserId={user.id}
              currentUserRank={currentUserRank}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
