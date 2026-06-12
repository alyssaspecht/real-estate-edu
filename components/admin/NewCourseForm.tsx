'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Category = { id: string; name: string }

export function NewCourseForm({ categories, redirectTo = '/admin/courses' }: { categories: Category[], redirectTo?: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('0')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [thumbnail, setThumbnail] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setThumbnail(data.url)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, categoryId, price, thumbnail, visibility }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push(redirectTo)
    } else {
      setError(data.error ?? 'Failed to create course')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Thumbnail Image
        </label>
        <div className="flex items-center gap-4">
          {thumbnail ? (
            <img src={thumbnail} className="w-32 h-20 object-cover rounded-lg border" alt="Thumbnail" />
          ) : (
            <div className="w-32 h-20 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
          <label className="cursor-pointer bg-muted hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {uploading ? 'Uploading...' : 'Upload image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Course Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g. Mastering Lead Generation in 2026"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="What will students learn in this course?"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Who can access this course?
        </label>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
            <input
              type="radio"
              name="visibility"
              checked={visibility === 'PUBLIC'}
              onChange={() => setVisibility('PUBLIC')}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Public — listed for purchase</p>
              <p className="text-xs text-muted-foreground">Shows up in the course catalog for anyone to find and enroll in.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
            <input
              type="radio"
              name="visibility"
              checked={visibility === 'PRIVATE'}
              onChange={() => setVisibility('PRIVATE')}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Private — invite only</p>
              <p className="text-xs text-muted-foreground">Hidden from the catalog. Only accessible to people you assign or invite directly (e.g. your team).</p>
            </div>
          </label>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Price (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            className="w-full pl-7 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Set to 0 for a free course</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Creating...' : 'Create course'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/courses')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
