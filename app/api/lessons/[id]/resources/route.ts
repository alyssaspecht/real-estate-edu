import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { name, fileUrl, type } = await request.json()

  if (!name || !fileUrl) {
    return NextResponse.json({ error: 'Missing name or fileUrl' }, { status: 400 })
  }

  const resource = await prisma.resource.create({
    data: { lessonId: id, name, fileUrl, type: type ?? 'FILE' },
  })

  return NextResponse.json({ resource })
}
