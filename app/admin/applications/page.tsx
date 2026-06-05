import { prisma } from '@/lib/prisma'
import { ApplicationsList } from '@/components/admin/ApplicationsList'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const applications = await prisma.creatorApplication.findMany({
    include: { user: true },
    orderBy: { submittedAt: 'desc' },
  })

  const pending = applications.filter(a => a.status === 'PENDING')
  const reviewed = applications.filter(a => a.status !== 'PENDING')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Applications</h1>
          <p className="text-gray-500 mt-1">{pending.length} pending review</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">No applications yet</p>
          </div>
        ) : (
          <ApplicationsList applications={applications} />
        )}
      </div>
    </div>
  )
}
