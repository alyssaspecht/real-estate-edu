import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check for existing application
  const existing = await prisma.creatorApplication.findUnique({
    where: { userId: user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'Application already submitted' }, { status: 400 })
  }

  const { bio, experience, topics } = await request.json()

  await prisma.creatorApplication.create({
    data: {
      userId: user.id,
      status: 'PENDING',
      notes: JSON.stringify({ bio, experience, topics }),
    },
  })

  return NextResponse.json({ success: true })
}
