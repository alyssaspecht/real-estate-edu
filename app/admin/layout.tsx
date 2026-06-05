import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getUser'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.role !== 'ADMIN') redirect('/dashboard?error=unauthorized')

  return <>{children}</>
}
