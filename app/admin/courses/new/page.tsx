import { prisma } from '@/lib/prisma'
import { NewCourseForm } from '@/components/admin/NewCourseForm'

export default async function NewCoursePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">New Course</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to create a new course</p>
        </div>
        <NewCourseForm categories={categories} />
      </div>
    </div>
  )
}
