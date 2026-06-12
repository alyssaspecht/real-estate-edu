import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [dbUser, allBadges, userBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, streak: true },
    }),
    prisma.badge.findMany({ orderBy: { category: 'asc' } }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    }),
  ])

  const earnedSlugs = new Set(userBadges.map(ub => ub.badge.slug))

  const badges = allBadges.map(b => ({
    ...b,
    earned: earnedSlugs.has(b.slug),
    earnedAt: userBadges.find(ub => ub.badge.slug === b.slug)?.earnedAt ?? null,
  }))

  return NextResponse.json({
    xp: dbUser?.xp ?? 0,
    streak: dbUser?.streak ?? { current: 0, longest: 0 },
    badges,
  })
}
