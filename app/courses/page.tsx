import { prisma } from '@/lib/prisma'
import { CourseBrowse } from '@/components/learner/CourseBrowse'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: {
        category: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <CourseBrowse courses={courses} categories={categories} />
}
