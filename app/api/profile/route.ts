import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  })

  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    profile: {
      name: dbUser.name,
      headline: dbUser.profile?.headline ?? '',
      bio: dbUser.profile?.bio ?? '',
    }
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, headline, bio } = await request.json()

  // Update name on User record
  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  })

  // Upsert profile (create if doesn't exist, update if it does)
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { headline, bio },
    create: { userId: user.id, headline, bio },
  })

  return NextResponse.json({ success: true })
}
