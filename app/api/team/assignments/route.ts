import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

// Assign one or more courses to one or more team members
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberIds, courseIds } = await req.json()
  if (!Array.isArray(memberIds) || !Array.isArray(courseIds) || memberIds.length === 0 || courseIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one member and one course' }, { status: 400 })
  }

  // Ensure all members belong to this team lead's roster
  const memberships = await prisma.teamMembership.findMany({
    where: { teamLeadId: currentUser.id, memberId: { in: memberIds } },
  })
  const validMemberIds = new Set(memberships.map((m) => m.memberId))

  let count = 0
  for (const memberId of memberIds) {
    if (!validMemberIds.has(memberId)) continue
    for (const courseId of courseIds) {
      await prisma.assignment.upsert({
        where: { assignedToId_courseId: { assignedToId: memberId, courseId } },
        update: {},
        create: { assignedById: currentUser.id, assignedToId: memberId, courseId },
      })

      // Auto-enroll so progress tracking works the same way as self-enrollment
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: memberId, courseId } },
        update: {},
        create: { userId: memberId, courseId, pricePaid: 0 },
      })

      count++
    }
  }

  return NextResponse.json({ assigned: count })
}
