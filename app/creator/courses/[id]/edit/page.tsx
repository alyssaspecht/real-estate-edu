import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getUser'
import { CreatorCourseEditor } from '@/components/creator/CreatorCourseEditor'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CreatorEditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) notFound()

  const [course, categories] = await Promise.all([
    prisma.course.findUnique({
      where: { id, creatorId: user.id },
      include: {
        modules: {
          orderBy: { position: 'asc' },
          include: { lessons: { orderBy: { position: 'asc' }, include: { resources: true } } },
        },
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!course) notFound()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
            ← Back to dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <Link
              href={`/creator/courses/${id}/students`}
              className="text-sm text-muted-foreground border border-border bg-card px-4 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              👥 View Students
            </Link>
          </div>
        </div>
        <CreatorCourseEditor course={course} categories={categories} />
      </div>
    </div>
  )
}
