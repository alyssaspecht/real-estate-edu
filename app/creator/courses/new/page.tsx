import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { NewCourseForm } from '@/components/admin/NewCourseForm'

export default async function CreatorNewCoursePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">New Course</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to create your course</p>
        </div>
        <Link
          href="/creator/courses/ai-builder"
          className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-4 hover:border-primary/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl shrink-0">✨</div>
          <div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Build with AI instead</p>
            <p className="text-sm text-muted-foreground">Paste a transcript or notes and let AI draft the course structure for you</p>
          </div>
        </Link>
        <NewCourseForm categories={categories} />
      </div>
    </div>
  )
}
