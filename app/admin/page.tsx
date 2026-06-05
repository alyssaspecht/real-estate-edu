import { prisma } from '@/lib/prisma'
import { AdminUserTable } from '@/components/admin/AdminUserTable'

export default async function AdminPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage users and roles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
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
            <p className="text-sm text-gray-500">Learners</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {users.filter(u => u.role === 'LEARNER').length}
            </p>
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
