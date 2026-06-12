import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Upsert: create the DB user record if it doesn't exist yet.
  // This handles new signups, OAuth logins, and any case where the
  // Supabase auth record exists but the DB record was lost/never created.
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {
      // Keep email in sync with Supabase auth in case it changed
      email: user.email ?? '',
    },
    create: {
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
      role: 'LEARNER',
    },
  })

  return dbUser
}
