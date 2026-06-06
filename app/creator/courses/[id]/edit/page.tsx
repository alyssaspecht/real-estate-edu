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
          include: { lessons: { orderBy: { position: 'asc' } } },
        },
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!course) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/creator" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        </div>
        <CreatorCourseEditor course={course} categories={categories} />
      </div>
    </div>
  )
}
