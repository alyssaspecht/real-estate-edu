import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, title } = await request.json()
  if (!courseId || !title) {
    return NextResponse.json({ error: 'courseId and title required' }, { status: 400 })
  }

  const count = await prisma.module.count({ where: { courseId } })

  const module = await prisma.module.create({
    data: { courseId, title, position: count + 1 },
    include: { lessons: { orderBy: { position: 'asc' } } },
  })

  return NextResponse.json({ module })
}
