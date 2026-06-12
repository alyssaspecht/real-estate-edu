import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CourseBrowse } from '@/components/learner/CourseBrowse'
import { getCurrentUser } from '@/lib/auth/getUser'

export const dynamic = 'force-dynamic'

const courseCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnail: true,
  price: true,
  category: true,
  creator: { select: { id: true, name: true } },
  _count: { select: { enrollments: true } },
  reviews: { select: { rating: true } },
} as const

type CourseCard = Prisma.CourseGetPayload<{ select: typeof courseCardSelect }>

export default async function CoursesPage() {
  const [courses, categories, currentUser] = await Promise.all([
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
    getCurrentUser(),
  ])

  let myCourses: CourseCard[] = []

  if (currentUser) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: currentUser.id },
      include: { course: { select: courseCardSelect } },
    })
    myCourses = enrollments.map((e) => e.course)

    if (currentUser.role === 'CREATOR' || currentUser.role === 'ADMIN') {
      const authored = await prisma.course.findMany({
        where: { creatorId: currentUser.id },
        select: courseCardSelect,
        orderBy: { createdAt: 'desc' },
      })
      const seen = new Set(myCourses.map((c) => c.id))
      for (const c of authored) {
        if (!seen.has(c.id)) {
          myCourses.push(c)
          seen.add(c.id)
        }
      }
    }
  }

  return (
    <CourseBrowse
      courses={courses}
      categories={categories}
      myCourses={myCourses}
      isLoggedIn={!!currentUser}
    />
  )
}
