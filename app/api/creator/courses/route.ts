import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courses = await prisma.course.findMany({
    where: { creatorId: user.id },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  return NextResponse.json(courses)
}
