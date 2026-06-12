import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
}

// GET /api/paths — public list of published paths (or creator's own paths)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === 'true'

  if (mine) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const paths = await prisma.learningPath.findMany({
      where: { creatorId: user.id },
      include: {
        courses: {
          orderBy: { position: 'asc' },
          include: { course: { select: { id: true, title: true, price: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(paths)
  }

  const paths = await prisma.learningPath.findMany({
    where: { published: true },
    include: {
      creator: { select: { id: true, name: true } },
      courses: {
        orderBy: { position: 'asc' },
        include: { course: { select: { id: true, title: true, thumbnail: true, price: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(paths)
}

// POST /api/paths — creator creates a learning path
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, thumbnail, price, courseIds, published } = await req.json()
  if (!title || !courseIds?.length) {
    return NextResponse.json({ error: 'Title and at least one course required' }, { status: 400 })
  }

  const path = await prisma.learningPath.create({
    data: {
      creatorId: user.id,
      title,
      slug: slugify(title),
      description: description || null,
      thumbnail: thumbnail || null,
      price: price ?? 0,
      published: published ?? false,
      courses: {
        create: courseIds.map((id: string, i: number) => ({ courseId: id, position: i })),
      },
    },
    include: { courses: { include: { course: { select: { title: true } } } } },
  })

  return NextResponse.json(path, { status: 201 })
}

// PATCH /api/paths — update a learning path
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, title, description, thumbnail, price, courseIds, published } = await req.json()
  const existing = await prisma.learningPath.findUnique({ where: { id } })
  if (!existing || existing.creatorId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Replace course list if provided
  if (courseIds) {
    await prisma.learningPathCourse.deleteMany({ where: { learningPathId: id } })
    await prisma.learningPathCourse.createMany({
      data: courseIds.map((cId: string, i: number) => ({ learningPathId: id, courseId: cId, position: i })),
    })
  }

  const updated = await prisma.learningPath.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(price !== undefined && { price }),
      ...(published !== undefined && { published }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/paths
export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const existing = await prisma.learningPath.findUnique({ where: { id } })
  if (!existing || existing.creatorId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.learningPath.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
