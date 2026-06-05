import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CreatorApplicationForm } from '@/components/learner/CreatorApplicationForm'

export const dynamic = 'force-dynamic'

export default async function BecomeCreatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { creatorApplication: true },
  })

  if (!dbUser) redirect('/dashboard')

  // Already a creator or admin
  if (dbUser.role === 'CREATOR' || dbUser.role === 'ADMIN') {
    redirect('/creator')
  }

  const application = dbUser.creatorApplication

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Become a Creator</h1>
          <p className="text-gray-500 mt-1">Share your knowledge and earn revenue from your courses</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📚', title: 'Create Courses', desc: 'Build and publish your own courses' },
            { icon: '💰', title: 'Earn Revenue', desc: 'Get paid for every enrollment' },
            { icon: '👥', title: 'Build Audience', desc: 'Grow your following on the platform' },
          ].map(b => (
            <div key={b.title} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-2xl mb-2">{b.icon}</div>
              <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
              <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Application status or form */}
        {application ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            {application.status === 'PENDING' && (
              <>
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h2>
                <p className="text-gray-500">We've received your application and will review it shortly. You'll be notified when a decision is made.</p>
              </>
            )}
            {application.status === 'APPROVED' && (
              <>
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Application Approved!</h2>
                <p className="text-gray-500 mb-4">Congratulations! You are now a creator.</p>
                <a href="/creator" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors inline-block">
                  Go to Creator Dashboard →
                </a>
              </>
            )}
            {application.status === 'REJECTED' && (
              <>
                <div className="text-4xl mb-4">❌</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Application Not Approved</h2>
                <p className="text-gray-500">Unfortunately your application wasn't approved at this time. Please contact support for more information.</p>
              </>
            )}
          </div>
        ) : (
          <CreatorApplicationForm />
        )}
      </div>
    </div>
  )
}
