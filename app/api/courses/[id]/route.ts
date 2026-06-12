import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...body,
      publishedAt: body.status === 'PUBLISHED' ? new Date() : undefined,
    },
  })

  return NextResponse.json({ course })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const course = await prisma.course.findUnique({ where: { id }, select: { creatorId: true } })
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
  if (currentUser.role !== 'ADMIN' && course.creatorId !== currentUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.course.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
