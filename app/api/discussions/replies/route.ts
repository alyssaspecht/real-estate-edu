import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { notifyDiscussionReply } from '@/lib/notifications'

// GET /api/discussions/replies?discussionId=xxx  — enrolled users and creator only
export async function GET(req: NextRequest) {
  const discussionId = req.nextUrl.searchParams.get('discussionId')
  if (!discussionId) return NextResponse.json({ error: 'discussionId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: { course: { select: { id: true, creatorId: true } } },
  })
  if (!discussion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: discussion.course.id } },
  })
  if (!enrollment && discussion.course.creatorId !== user.id) {
    return NextResponse.json({ error: 'Must be enrolled to view replies' }, { status: 403 })
  }

  const replies = await prisma.discussionReply.findMany({
    where: { discussionId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
  })

  return NextResponse.json(replies)
}

// POST /api/discussions/replies  — add a reply (enrolled or creator)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { discussionId, body } = await req.json()
  if (!discussionId || !body?.trim()) {
    return NextResponse.json({ error: 'discussionId and body are required' }, { status: 400 })
  }

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: { course: { select: { id: true, creatorId: true, communityEnabled: true, slug: true, title: true } } },
  })
  if (!discussion) return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
  if (!discussion.course.communityEnabled) return NextResponse.json({ error: 'Community disabled' }, { status: 403 })

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: discussion.course.id } },
  })
  if (!enrollment && discussion.course.creatorId !== user.id) {
    return NextResponse.json({ error: 'Must be enrolled to reply' }, { status: 403 })
  }

  const [reply, dbUser] = await Promise.all([
    prisma.discussionReply.create({
      data: { discussionId, authorId: user.id, body: body.trim() },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }),
  ])

  // Fire notifications in the background — don't await so response is fast
  notifyDiscussionReply({
    discussionId,
    replierId: user.id,
    replierName: dbUser?.name ?? null,
    courseSlug: discussion.course.slug,
    courseTitle: discussion.course.title,
  }).catch(() => {}) // silent fail — notifications are non-critical

  return NextResponse.json(reply, { status: 201 })
}

// DELETE /api/discussions/replies  — creator or author
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const reply = await prisma.discussionReply.findUnique({
    where: { id },
    include: {
      discussion: { include: { course: { select: { creatorId: true } } } },
    },
  })
  if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isCreator = reply.discussion.course.creatorId === user.id
  const isAuthor = reply.authorId === user.id
  if (!isCreator && !isAuthor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.discussionReply.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
