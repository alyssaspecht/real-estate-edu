'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type LessonDraft = { title: string; contentBody: string }
type ModuleDraft = { title: string; lessons: LessonDraft[] }
type CourseDraft = { title: string; description: string; categoryId: string | null; modules: ModuleDraft[] }

type Category = { id: string; name: string }

export function AICourseBuilder({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [sourceText, setSourceText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<CourseDraft | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateThumbnail = async (title: string, description: string) => {
    setGeneratingThumbnail(true)
    try {
      const res = await fetch('/api/ai/course-builder/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const data = await res.json()
      if (res.ok) setThumbnail(data.url)
    } finally {
      setGeneratingThumbnail(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setDraft(null)
    setThumbnail(null)

    const res = await fetch('/api/ai/course-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceText }),
    })
    const data = await res.json()

    if (res.ok) {
      setDraft(data.draft)
      generateThumbnail(data.draft.title, data.draft.description)
    } else {
      setError(data.error ?? 'Failed to generate draft')
    }
    setGenerating(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setFileName(file.name)

    if (file.type === 'application/pdf') {
      setExtracting(true)
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/ai/extract-text', { method: 'POST', body: form })
        const data = await res.json()
        if (res.ok) {
          setSourceText(data.text)
        } else {
          setError(data.error ?? 'Failed to read PDF')
        }
      } finally {
        setExtracting(false)
      }
    } else if (file.type.startsWith('text/') || /\.(txt|md|markdown)$/i.test(file.name)) {
      const text = await file.text()
      setSourceText(text)
    } else {
      setError('Unsupported file type. Please upload a PDF or a plain text/markdown file, or paste your text below.')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreate = async () => {
    if (!draft) return
    setCreating(true)
    setError('')

    const res = await fetch('/api/ai/course-builder/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, thumbnail }),
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

        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors mb-3">
          <span className="text-sm font-medium text-foreground">
            {extracting ? 'Reading file…' : fileName ? `Loaded: ${fileName}` : 'Click to upload a PDF, .txt, or .md file'}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Or paste your text in the box below</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown,text/plain,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={extracting}
          />
        </label>

        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Paste a transcript, training notes, or outline here — or upload a file above. The more detail you provide, the better the draft will be..."
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">
            {sourceText.trim().length < 50
              ? 'Add at least a few sentences to get started.'
              : `${sourceText.trim().length.toLocaleString()} characters`}
          </p>
          <Button onClick={handleGenerate} disabled={generating || extracting || sourceText.trim().length < 50}>
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

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Thumbnail</label>
            <div className="flex items-center gap-4">
              <div className="w-40 h-24 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {generatingThumbnail ? (
                  <span className="text-xs text-muted-foreground">Generating…</span>
                ) : thumbnail ? (
                  <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No thumbnail</span>
                )}
              </div>
              <button
                onClick={() => generateThumbnail(draft.title, draft.description)}
                disabled={generatingThumbnail}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {thumbnail ? 'Regenerate thumbnail' : 'Generate thumbnail'}
              </button>
            </div>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={draft.categoryId ?? ''}
              onChange={(e) => updateDraft((d) => ({ ...d, categoryId: e.target.value || null }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
            <Button variant="outline" onClick={() => { setDraft(null); setThumbnail(null) }}>
              Discard draft
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
