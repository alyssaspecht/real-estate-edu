import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { applicationId, userId, decision } = await request.json()

  // Update application status
  await prisma.creatorApplication.update({
    where: { id: applicationId },
    data: { status: decision, reviewedAt: new Date() },
  })

  // If approved, upgrade user role to CREATOR
  if (decision === 'APPROVED') {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'CREATOR' },
    })
  }

  return NextResponse.json({ success: true })
}
