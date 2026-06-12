import { AICourseBuilder } from '@/components/creator/AICourseBuilder'

export default function AICourseBuilderPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">AI Course Builder</h1>
          <p className="text-muted-foreground mt-1">
            Paste a transcript, outline, or notes — AI will structure it into a course draft for you to review and edit.
          </p>
        </div>
        <AICourseBuilder />
      </div>
    </div>
  )
}
