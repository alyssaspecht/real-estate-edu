import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PrintButton } from '@/components/learner/PrintButton'

export const dynamic = 'force-dynamic'

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { creator: { select: { name: true } } },
  })
  if (!course) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  })

  // Only show certificate if enrollment exists and all lessons are completed
  if (!enrollment?.completedAt) notFound()

  const learner = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  })

  const completionDate = new Date(enrollment.completedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8 print:bg-white print:p-0">
      {/* Back link — hidden on print */}
      <div className="mb-6 self-start print:hidden">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to dashboard
        </Link>
      </div>

      {/* Print button — hidden on print */}
      <div className="mb-6 self-end print:hidden">
        <PrintButton />
      </div>

      {/* Certificate */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
        {/* Top accent bar */}
        <div className="h-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />

        <div className="px-16 py-14 text-center">
          {/* Badge */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl shadow-md">
            🎓
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Certificate of Completion
          </p>

          <p className="text-gray-600 mt-4 mb-2 text-lg">This certifies that</p>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {learner?.name ?? 'Learner'}
          </h1>

          <p className="text-gray-600 text-lg mb-2">has successfully completed</p>

          <h2 className="text-2xl font-bold text-blue-700 mb-8 leading-snug max-w-lg mx-auto">
            {course.title}
          </h2>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-300 text-xl">✦</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-center gap-16 text-sm text-gray-500">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Instructor</p>
              <p className="font-semibold text-gray-800">{course.creator.name ?? 'Instructor'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Completed</p>
              <p className="font-semibold text-gray-800">{completionDate}</p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
      </div>
    </div>
  )
}
