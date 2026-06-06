import { prisma } from '@/lib/prisma'
import { CourseBrowse } from '@/components/learner/CourseBrowse'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <CourseBrowse courses={courses} categories={categories} />
}
