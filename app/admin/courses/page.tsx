import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AdminCourseList } from '@/components/admin/AdminCourseList'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      category: true,
      creator: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">← Admin Dashboard</Link>
            <h1 className="text-3xl font-bold text-foreground">Courses</h1>
            <p className="text-muted-foreground mt-1">Manage all courses on the platform</p>
          </div>
          <Link
            href="/admin/courses/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">No courses yet</p>
            <Link
              href="/admin/courses/new"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <AdminCourseList courses={courses} />
          </div>
        )}
      </div>
    </div>
  )
}
