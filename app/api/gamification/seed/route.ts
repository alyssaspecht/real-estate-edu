import { NextResponse } from 'next/server'
import { seedBadges } from '@/lib/gamification'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await seedBadges()
  return NextResponse.json({ success: true })
}
