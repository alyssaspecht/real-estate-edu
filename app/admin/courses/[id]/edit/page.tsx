import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CurriculumBuilder } from '@/components/admin/CurriculumBuilder'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: { orderBy: { position: 'asc' } },
        },
      },
      category: true,
    },
  })

  if (!course) notFound()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
              ← Back to courses
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {course.status === 'PUBLISHED' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Curriculum Builder */}
        <CurriculumBuilder course={course} />
      </div>
    </div>
  )
}
