import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/discussions?courseId=xxx  — list threads (enrolled users and creator only)
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [enrollment, course] = await Promise.all([
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { creatorId: true } }),
  ])

  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!enrollment && course.creatorId !== user.id) {
    return NextResponse.json({ error: 'Must be enrolled to view discussions' }, { status: 403 })
  }

  const discussions = await prisma.discussion.findMany({
    where: { courseId },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { replies: true } },
    },
  })

  return NextResponse.json(discussions)
}

// POST /api/discussions  — create a new thread (enrolled users only)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, title, body } = await req.json()
  if (!courseId || !title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'courseId, title, and body are required' }, { status: 400 })
  }

  // Must be enrolled or be the course creator
  const [enrollment, course] = await Promise.all([
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { creatorId: true, communityEnabled: true } }),
  ])

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (!course.communityEnabled) return NextResponse.json({ error: 'Community disabled' }, { status: 403 })
  if (!enrollment && course.creatorId !== user.id) {
    return NextResponse.json({ error: 'Must be enrolled to post' }, { status: 403 })
  }

  const discussion = await prisma.discussion.create({
    data: { courseId, authorId: user.id, title: title.trim(), body: body.trim() },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { replies: true } },
    },
  })

  return NextResponse.json(discussion, { status: 201 })
}

// PATCH /api/discussions  — pin/unpin or edit (creator or author)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, pinned, title, body } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: { course: { select: { creatorId: true } } },
  })
  if (!discussion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isCreator = discussion.course.creatorId === user.id
  const isAuthor = discussion.authorId === user.id

  if (!isCreator && !isAuthor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updated = await prisma.discussion.update({
    where: { id },
    data: {
      ...(pinned !== undefined && isCreator ? { pinned } : {}),
      ...(title !== undefined && isAuthor ? { title: title.trim() } : {}),
      ...(body !== undefined && isAuthor ? { body: body.trim() } : {}),
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { replies: true } },
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/discussions  — creator or author can delete
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: { course: { select: { creatorId: true } } },
  })
  if (!discussion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isCreator = discussion.course.creatorId === user.id
  const isAuthor = discussion.authorId === user.id
  if (!isCreator && !isAuthor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.discussion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
