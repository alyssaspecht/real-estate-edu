import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    include: { category: true, _count: { select: { enrollments: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-500 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">No courses available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} className="w-full h-44 object-cover" alt={course.title} />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-4xl">📚</span>
                    </div>
                  )}
                  <div className="p-5">
                    {course.category && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {course.category.name}
                      </span>
                    )}
                    <h2 className="font-semibold text-gray-900 mt-2 mb-1 line-clamp-2">{course.title}</h2>
                    {course.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        {course._count.enrollments} students
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
