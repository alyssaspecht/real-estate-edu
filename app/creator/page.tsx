import { getCurrentUser } from '@/lib/auth/getUser'

export default async function CreatorPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.name ?? user?.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">My Courses</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">0</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-1">$0</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No courses yet. Course builder coming soon!</p>
        </div>
      </div>
    </div>
  )
}
