import { AICourseBuilder } from '@/components/creator/AICourseBuilder'
import { prisma } from '@/lib/prisma'

export default async function AICourseBuilderPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">AI Course Builder</h1>
          <p className="text-muted-foreground mt-1">
            Paste a transcript, outline, or notes — or upload a PDF/text file — and AI will structure it into a course draft, complete with a suggested category and thumbnail, for you to review and edit.
          </p>
        </div>
        <AICourseBuilder categories={categories} />
      </div>
    </div>
  )
}
