import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PathForm } from '@/components/creator/PathForm'

export const dynamic = 'force-dynamic'

export default async function NewPathPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) notFound()

  const courses = await prisma.course.findMany({
    where: { creatorId: user.id, status: 'PUBLISHED' },
    select: { id: true, title: true, price: true },
    orderBy: { title: 'asc' },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">New Learning Path</h1>
        <PathForm courses={courses} />
      </div>
    </div>
  )
}
