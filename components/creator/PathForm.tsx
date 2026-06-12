'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Course = { id: string; title: string; price: number }

type Existing = {
  id: string
  title: string
  description: string
  price: number
  published: boolean
  courseIds: string[]
}

export function PathForm({ courses, existing }: { courses: Course[]; existing?: Existing }) {
  const router = useRouter()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [price, setPrice] = useState(existing ? String(existing.price / 100) : '0')
  const [published, setPublished] = useState(existing?.published ?? false)
  const [selectedIds, setSelectedIds] = useState<string[]>(existing?.courseIds ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const totalValue = selectedIds.reduce((s, id) => {
    const c = courses.find(c => c.id === id)
    return s + (c?.price ?? 0)
  }, 0)
  const priceCents = Math.round(parseFloat(price || '0') * 100)
  const savings = totalValue - priceCents

  function toggleCourse(id: string) {
    setSelectedIds(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    )
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSelectedIds(ids => {
      const next = [...ids]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setSelectedIds(ids => {
      if (index === ids.length - 1) return ids
      const next = [...ids]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) { setError('Add at least one course'); return }
    setSaving(true)
    setError('')

    const body = { title, description, price: priceCents, courseIds: selectedIds, published }
    const res = existing
      ? await fetch('/api/paths', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, ...body }) })
      : await fetch('/api/paths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    setSaving(false)
    if (res.ok) {
      router.push('/creator/paths')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
  }

  async function handleDelete() {
    if (!existing || !confirm('Delete this learning path?')) return
    setDeleting(true)
    await fetch('/api/paths', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id }) })
    router.push('/creator/paths')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link href="/creator/paths" className="text-sm text-muted-foreground hover:text-foreground block -mt-4 mb-2">← Back to paths</Link>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Path Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="e.g. Complete Agent Foundations"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="What will learners achieve by completing this path?"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bundle Price ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {totalValue > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Individual total: ${(totalValue / 100).toFixed(2)}
              {savings > 0 && <span className="text-green-600 ml-2">Learners save ${(savings / 100).toFixed(2)}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Published</p>
            <p className="text-xs text-muted-foreground">Visible to learners on the paths page</p>
          </div>
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${published ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow transition-transform ${published ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Course selection */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold text-foreground mb-1">Courses in this path</h2>
        <p className="text-xs text-muted-foreground mb-4">Select courses and drag to reorder</p>

        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You need at least one published course. <Link href="/creator" className="text-primary hover:underline">Create a course first.</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {/* Selected courses (ordered) */}
            {selectedIds.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected order</p>
                {selectedIds.map((id, i) => {
                  const course = courses.find(c => c.id === id)
                  if (!course) return null
                  return (
                    <div key={id} className="flex items-center gap-3 bg-primary/10 border border-blue-100 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-blue-400 w-4">{i + 1}</span>
                      <span className="flex-1 text-sm text-foreground">{course.title}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 px-1">↑</button>
                        <button type="button" onClick={() => moveDown(i)} disabled={i === selectedIds.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 px-1">↓</button>
                        <button type="button" onClick={() => toggleCourse(id)} className="text-red-400 hover:text-red-600 px-1 text-xs">✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Available courses to add */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your published courses</p>
            {courses.map(course => {
              const selected = selectedIds.includes(course.id)
              return (
                <label key={course.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${selected ? 'bg-primary/10 border border-blue-200' : 'border border-border hover:bg-muted'}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCourse(course.id)}
                    className="rounded border-border"
                  />
                  <span className="flex-1 text-sm text-foreground">{course.title}</span>
                  <span className="text-xs text-muted-foreground">{course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create Path'}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-3 rounded-xl font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
