import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [topUsers, currentUser] = await Promise.all([
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
    user
      ? prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, name: true, xp: true, avatarUrl: true },
        })
      : null,
  ])

  // Get current user's rank
  let currentUserRank: number | null = null
  if (currentUser) {
    const rank = await prisma.user.count({
      where: { xp: { gt: currentUser.xp } },
    })
    currentUserRank = rank + 1
  }

  return NextResponse.json({ topUsers, currentUser, currentUserRank })
}
