import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PathForm } from '@/components/creator/PathForm'

export const dynamic = 'force-dynamic'

export default async function EditPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) notFound()

  const [path, courses] = await Promise.all([
    prisma.learningPath.findUnique({
      where: { id },
      include: { courses: { orderBy: { position: 'asc' }, select: { courseId: true } } },
    }),
    prisma.course.findMany({
      where: { creatorId: user.id, status: 'PUBLISHED' },
      select: { id: true, title: true, price: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!path || path.creatorId !== user.id) notFound()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Edit Learning Path</h1>
        <PathForm
          courses={courses}
          existing={{
            id: path.id,
            title: path.title,
            description: path.description ?? '',
            price: path.price,
            published: path.published,
            courseIds: path.courses.map(pc => pc.courseId),
          }}
        />
      </div>
    </div>
  )
}
