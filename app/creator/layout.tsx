import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getUser'

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
    redirect('/dashboard?error=unauthorized')
  }

  return <>{children}</>
}
