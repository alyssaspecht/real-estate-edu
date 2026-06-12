import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.teamMembership.findMany({
    where: { teamLeadId: currentUser.id },
    include: {
      member: {
        include: {
          enrollments: {
            include: { course: { select: { title: true } } },
          },
          assignmentsToMe: {
            include: { course: { select: { id: true, title: true } } },
          },
          lessonProgress: {
            where: { completedAt: { not: null } },
            select: { lessonId: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ members: memberships.map((m) => m.member) })
}

// Bulk add team members by pasted "name, email" lines (or just emails)
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await req.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No input provided' }, { status: 400 })
  }

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const emailRegex = /[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/

  const added: string[] = []
  const skipped: string[] = []

  for (const line of lines) {
    const emailMatch = line.match(emailRegex)
    if (!emailMatch) {
      skipped.push(line)
      continue
    }
    const email = emailMatch[0].toLowerCase()
    const name = line.replace(emailMatch[0], '').replace(/[,;<>]/g, '').trim() || null

    const user = await prisma.user.upsert({
      where: { email },
      update: name ? { name } : {},
      create: { email, name, role: 'LEARNER' },
    })

    await prisma.teamMembership.upsert({
      where: { teamLeadId_memberId: { teamLeadId: currentUser.id, memberId: user.id } },
      update: {},
      create: { teamLeadId: currentUser.id, memberId: user.id },
    })

    added.push(email)
  }

  return NextResponse.json({ added, skipped })
}
