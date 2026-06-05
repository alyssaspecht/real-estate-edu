import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courses = await prisma.course.findMany({
    include: { category: true, _count: { select: { enrollments: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ courses })
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, categoryId, price, thumbnail } = await request.json()

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now()

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description,
      thumbnail,
      price: price ? Math.round(parseFloat(price) * 100) : 0,
      categoryId: categoryId || null,
      creatorId: currentUser.id,
      status: 'DRAFT',
    },
  })

  return NextResponse.json({ course })
}
