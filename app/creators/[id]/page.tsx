import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const creator = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      createdCourses: {
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        include: {
          category: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  })

  if (!creator || (creator.role !== 'CREATOR' && creator.role !== 'ADMIN')) {
    notFound()
  }

  const firstName = creator.name?.split(' ')[0] ?? 'Creator'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.name ?? ''}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                (creator.name?.[0] ?? '?').toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{creator.name ?? 'Creator'}</h1>
              {creator.profile?.headline && (
                <p className="text-lg text-gray-600 mt-1">{creator.profile.headline}</p>
              )}
              {creator.profile?.bio && (
                <p className="text-gray-500 mt-3 leading-relaxed max-w-2xl">{creator.profile.bio}</p>
              )}
              {creator.profile?.website && (
                <a
                  href={creator.profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm mt-2"
                >
                  🔗 {creator.profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                <span>📚 {creator.createdCourses.length} {creator.createdCourses.length === 1 ? 'course' : 'courses'}</span>
                <span>👥 {creator.createdCourses.reduce((acc, c) => acc + c._count.enrollments, 0)} students</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Courses by {firstName}
        </h2>

        {creator.createdCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-500">{firstName} hasn't published any courses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creator.createdCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                      📚
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {course.category && (
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      {course.category.name}
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 leading-snug">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-500">
                      {course._count.enrollments} students
                    </span>
                    <span className="font-bold text-gray-900">
                      {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                    </span>
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
