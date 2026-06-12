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
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Platform overview</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/courses" className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all">
              Courses
            </Link>
            <Link href="/admin/applications" className="glass-card rounded-lg text-foreground px-4 py-2 text-sm font-medium hover:border-primary/30 transition-all">
              Applications
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-bold text-foreground mt-1">{users.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Creators</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {users.filter(u => u.role === 'CREATOR').length}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{courseCount}</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Enrollments</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{enrollmentCount}</p>
          </div>
        </div>

        {/* User Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Users</h2>
          </div>
          <AdminUserTable users={users} />
        </div>
      </div>
    </div>
  )
}
