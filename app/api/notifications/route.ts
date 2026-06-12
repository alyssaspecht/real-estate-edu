import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/notifications — fetch current user's notifications (latest 20)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: user.id, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

// PATCH /api/notifications — mark one or all as read
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, markAllRead } = await req.json()

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })
  } else if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    })
  }

  return NextResponse.json({ ok: true })
}
