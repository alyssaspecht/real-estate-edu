import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, watchPosition } = await request.json()

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {
      completedAt: new Date(),
      watchPositionSeconds: watchPosition ?? 0,
    },
    create: {
      userId: user.id,
      lessonId,
      completedAt: new Date(),
      watchPositionSeconds: watchPosition ?? 0,
    },
  })

  return NextResponse.json({ success: true })
}
