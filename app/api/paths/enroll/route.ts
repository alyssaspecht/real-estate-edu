import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'

// POST /api/paths/enroll — enroll learner in all courses in a path
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pathId } = await req.json()
  if (!pathId) return NextResponse.json({ error: 'Missing pathId' }, { status: 400 })

  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: { courses: { select: { courseId: true, course: { select: { price: true } } } } },
  })

  if (!path || !path.published) {
    return NextResponse.json({ error: 'Path not found' }, { status: 404 })
  }

  if (path.price > 0) {
    return NextResponse.json({ error: 'Payment required' }, { status: 402 })
  }

  // Upsert enrollment for every course in the path
  const results = await Promise.allSettled(
    path.courses.map(({ courseId }) =>
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId } },
        create: { userId: user.id, courseId, pricePaid: 0 },
        update: {},
      })
    )
  )

  const enrolled = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ enrolled })
}
