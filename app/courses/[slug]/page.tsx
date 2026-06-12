import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EnrollButton } from '@/components/learner/EnrollButton'
import { ReviewSection } from '@/components/learner/ReviewSection'
import { CourseDiscussion } from '@/components/learner/CourseDiscussion'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const course = await prisma.course.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      creator: { include: { profile: true } },
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: { orderBy: { position: 'asc' } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) notFound()

  // Check if current user is enrolled
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isEnrolled = false
  let firstLessonId = null

  if (user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    })
    isEnrolled = !!enrollment
  }

  // Reviews
  const reviews = await prisma.review.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, avatarUrl: true } } },
  })
  const averageRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  const existingReview = user ? (reviews.find(r => r.userId === user.id) ?? null) : null
  const isCreator = course.creatorId === user?.id

  // Find first lesson
  const firstModule = course.modules[0]
  if (firstModule?.lessons[0]) {
    firstLessonId = firstModule.lessons[0].id
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/8 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-8 py-12 flex gap-12 items-start">
          <div className="flex-1">
            {course.category && (
              <span className="text-primary text-sm font-medium">
                {course.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold text-foreground mt-2 mb-4">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>📚 {course.modules.length} modules</span>
              <span>🎬 {totalLessons} lessons</span>
              <span>👥 {course._count.enrollments} students</span>
            </div>
          </div>

          {/* Enrollment card */}
          <div className="w-80 glass-card rounded-2xl p-6 text-foreground shrink-0">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                className="w-full h-40 object-cover rounded-lg mb-4"
                alt={course.title}
              />
            )}
            <p className="text-3xl font-bold mb-4">
              {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
            </p>

            {isEnrolled ? (
              <Link
                href={`/courses/${slug}/lessons/${firstLessonId}`}
                className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Continue Learning →
              </Link>
            ) : user ? (
              <EnrollButton courseId={course.id} slug={slug} firstLessonId={firstLessonId} price={course.price} />
            ) : (
              <Link
                href="/login"
                className="block w-full bg-primary text-primary-foreground text-center py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign in to Enroll
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Instructor */}
      <div className="max-w-6xl mx-auto px-8 pt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Your Instructor</h2>
        <div className="glass-card rounded-2xl p-6 flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {course.creator.avatarUrl ? (
              <img src={course.creator.avatarUrl} alt={course.creator.name ?? ''} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              (course.creator.name?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/creators/${course.creator.id}`} className="font-semibold text-foreground hover:text-primary hover:underline text-lg">
              {course.creator.name ?? 'Instructor'}
            </Link>
            {course.creator.profile?.headline && (
              <p className="text-muted-foreground text-sm mt-0.5">{course.creator.profile.headline}</p>
            )}
            {course.creator.profile?.bio && (
              <p className="text-muted-foreground mt-3 leading-relaxed">{course.creator.profile.bio}</p>
            )}
            <Link href={`/creators/${course.creator.id}`} className="inline-block mt-3 text-sm text-primary hover:underline">
              View all courses by {course.creator.name?.split(' ')[0] ?? 'instructor'} →
            </Link>
          </div>
        </div>
      </div>

      {/* Average rating in hero */}
      {reviews.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 pt-4 pb-0">
          <div className="flex items-center gap-2 text-yellow-500 text-lg">
            {'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}
            <span className="text-foreground font-semibold text-sm">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
          </div>
        </div>
      )}

      {/* Curriculum */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Course Curriculum</h2>
        <div className="space-y-3">
          {course.modules.map((module) => (
            <div key={module.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-white/5 border-b border-white/8">
                <h3 className="font-semibold text-foreground">{module.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{module.lessons.length} lessons</p>
              </div>
              <div className="divide-y divide-white/6">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-sm">
                      {lesson.type === 'VIDEO' ? '🎬' : lesson.type === 'TEXT' ? '📝' : '📎'}
                    </span>
                    <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                    {lesson.durationSeconds && (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(lesson.durationSeconds / 60)}:{String(lesson.durationSeconds % 60).padStart(2, '0')}
                      </span>
                    )}
                    {lesson.isFreePreview && (
                      <Link
                        href={`/courses/${slug}/lessons/${lesson.id}`}
                        className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Free Preview
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-muted border-t border-border">
        <ReviewSection
          courseId={course.id}
          reviews={reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
          averageRating={averageRating}
          isEnrolled={isEnrolled}
          isCreator={isCreator}
          existingReview={existingReview ? { ...existingReview, createdAt: existingReview.createdAt.toISOString() } : null}
        />
      </div>

      {/* Community Discussion — enrolled users and creator only */}
      {course.communityEnabled && (isEnrolled || isCreator) && (
        <div className="max-w-6xl mx-auto px-8 py-12">
          <CourseDiscussion
            courseId={course.id}
            creatorId={course.creatorId}
            currentUserId={user?.id ?? null}
            isEnrolled={isEnrolled}
          />
        </div>
      )}
    </div>
  )
}
