import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getUser'

// GET /api/templates/:slug
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const template = await prisma.template.findUnique({
    where: { slug },
    include: {
      category: true,
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { purchases: true } },
    },
  })

  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(template)
}

// PATCH /api/templates/:slug — update (creator who owns it or admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const template = await prisma.template.findUnique({ where: { slug } })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = template.creatorId === user.id
  const isAdmin = user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    title, description, longDescription, price, categoryId,
    fileUrl, previewImageUrl, fileType, fileSize, status,
  } = body

  const updated = await prisma.template.update({
    where: { slug },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description }),
      ...(longDescription !== undefined && { longDescription }),
      ...(price !== undefined && { price: Math.max(0, Math.round(price)) }),
      ...(categoryId !== undefined && { categoryId }),
      ...(fileUrl !== undefined && { fileUrl }),
      ...(previewImageUrl !== undefined && { previewImageUrl }),
      ...(fileType !== undefined && { fileType }),
      ...(fileSize !== undefined && { fileSize }),
      ...(status !== undefined && {
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      }),
    },
    include: { category: true },
  })

  return NextResponse.json(updated)
}

// DELETE /api/templates/:slug
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const template = await prisma.template.findUnique({ where: { slug } })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (template.creatorId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.template.delete({ where: { slug } })
  return NextResponse.json({ ok: true })
}
