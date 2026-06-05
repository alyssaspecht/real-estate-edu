import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { moduleId, title, type } = await request.json()
  if (!moduleId || !title) {
    return NextResponse.json({ error: 'moduleId and title required' }, { status: 400 })
  }

  const count = await prisma.lesson.count({ where: { moduleId } })

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      type: type ?? 'VIDEO',
      position: count + 1,
    },
  })

  return NextResponse.json({ lesson })
}
