import { prisma } from '@/lib/prisma'
import { AdminUserTable } from '@/components/admin/AdminUserTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [users, courseCount, enrollmentCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.course.count(),
    prisma.enrollment.count(),
  ])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Platform overview</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/courses" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Courses
            </Link>
            <Link href="/admin/applications" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Applications
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Creators</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {users.filter(u => u.role === 'CREATOR').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{courseCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Enrollments</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{enrollmentCount}</p>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">All Users</h2>
          </div>
          <AdminUserTable users={users} />
        </div>
      </div>
    </div>
  )
}
