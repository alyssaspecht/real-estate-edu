'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type LessonDraft = { title: string; contentBody: string }
type ModuleDraft = { title: string; lessons: LessonDraft[] }
type CourseDraft = { title: string; description: string; modules: ModuleDraft[] }

export function AICourseBuilder() {
  const router = useRouter()
  const [sourceText, setSourceText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<CourseDraft | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setDraft(null)

    const res = await fetch('/api/ai/course-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceText }),
    })
    const data = await res.json()

    if (res.ok) {
      setDraft(data.draft)
    } else {
      setError(data.error ?? 'Failed to generate draft')
    }
    setGenerating(false)
  }

  const handleCreate = async () => {
    if (!draft) return
    setCreating(true)
    setError('')

    const res = await fetch('/api/ai/course-builder/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const data = await res.json()

    if (res.ok) {
      router.push(`/creator/courses/${data.course.id}/edit`)
    } else {
      setError(data.error ?? 'Failed to create course')
      setCreating(false)
    }
  }

  const updateDraft = (updater: (d: CourseDraft) => CourseDraft) => {
    setDraft((d) => (d ? updater(d) : d))
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Input */}
      <div className="glass-panel rounded-2xl p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Source material
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Paste a transcript, training notes, or outline here. The more detail you provide, the better the draft will be..."
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">
            {sourceText.trim().length < 50
              ? 'Add at least a few sentences to get started.'
              : `${sourceText.trim().length.toLocaleString()} characters`}
          </p>
          <Button onClick={handleGenerate} disabled={generating || sourceText.trim().length < 50}>
            {generating ? 'Generating draft…' : '✨ Generate with AI'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Step 2: Review & edit draft */}
      {draft && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Review your course draft</h2>
            <p className="text-sm text-muted-foreground">
              Edit anything below before creating the course. It will be saved as a Draft.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Course Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateDraft((d) => ({ ...d, title: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => updateDraft((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Curriculum ({draft.modules.length} module{draft.modules.length === 1 ? '' : 's'})
            </h3>
            {draft.modules.map((mod, mi) => (
              <div key={mi} className="border border-border rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) =>
                    updateDraft((d) => {
                      const modules = [...d.modules]
                      modules[mi] = { ...modules[mi], title: e.target.value }
                      return { ...d, modules }
                    })
                  }
                  className="w-full font-medium px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="space-y-3 pl-4">
                  {mod.lessons.map((lesson, li) => (
                    <div key={li} className="space-y-1">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) =>
                          updateDraft((d) => {
                            const modules = [...d.modules]
                            const lessons = [...modules[mi].lessons]
                            lessons[li] = { ...lessons[li], title: e.target.value }
                            modules[mi] = { ...modules[mi], lessons }
                            return { ...d, modules }
                          })
                        }
                        className="w-full text-sm px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <textarea
                        value={lesson.contentBody}
                        onChange={(e) =>
                          updateDraft((d) => {
                            const modules = [...d.modules]
                            const lessons = [...modules[mi].lessons]
                            lessons[li] = { ...lessons[li], contentBody: e.target.value }
                            modules[mi] = { ...modules[mi], lessons }
                            return { ...d, modules }
                          })
                        }
                        rows={4}
                        className="w-full text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating course…' : 'Create course as draft'}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Discard draft
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
