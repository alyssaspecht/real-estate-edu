'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string }

type CourseSettingsFormProps = {
  course: {
    id: string
    title: string
    description: string | null
    price: number
    thumbnail: string | null
    categoryId: string | null
    status: string
    hasCertificate: boolean
  }
  categories: Category[]
}

export function CourseSettingsForm({ course, categories }: CourseSettingsFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? '')
  const [price, setPrice] = useState(course.price === 0 ? '' : (course.price / 100).toFixed(2))
  const [categoryId, setCategoryId] = useState(course.categoryId ?? '')
  const [thumbnail, setThumbnail] = useState(course.thumbnail ?? '')
  const [hasCertificate, setHasCertificate] = useState(course.hasCertificate)
  const [saving, setSaving] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const uploadThumbnail = async (file: File) => {
    setUploadingThumb(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok && data.url) {
      setThumbnail(data.url)
    } else {
      setError('Thumbnail upload failed')
    }
    setUploadingThumb(false)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)

    const priceCents = price === '' ? 0 : Math.round(parseFloat(price) * 100)

    const res = await fetch(`/api/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        price: priceCents,
        categoryId: categoryId || null,
        thumbnail: thumbnail || null,
        hasCertificate,
      }),
    })

    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
        <div className="flex items-start gap-4">
          <div
            className="w-40 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-gray-400 transition-colors flex-shrink-0"
            onClick={() => thumbInputRef.current?.click()}
          >
            {thumbnail ? (
              <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xs text-center px-2">
                {uploadingThumb ? 'Uploading…' : 'Click to upload'}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 pt-1">
            <p>Recommended: 1280×720px (16:9)</p>
            <p className="mt-1">JPG, PNG, or WebP</p>
            <button
              onClick={() => thumbInputRef.current?.click()}
              disabled={uploadingThumb}
              className="mt-2 text-blue-600 hover:underline disabled:opacity-50 text-sm"
            >
              {uploadingThumb ? 'Uploading…' : thumbnail ? 'Replace thumbnail' : 'Upload thumbnail'}
            </button>
          </div>
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadThumbnail(file)
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Lead Gen Mastery"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="What will students learn? Who is this for?"
        />
      </div>

      {/* Category + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00 for free"
            />
          </div>
        </div>
      </div>

      {/* Certificate toggle */}
      <div className="flex items-center justify-between py-4 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900">Award completion certificate</p>
          <p className="text-xs text-gray-500 mt-0.5">Learners who finish all lessons can download a certificate</p>
        </div>
        <button
          type="button"
          onClick={() => setHasCertificate(!hasCertificate)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            hasCertificate ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              hasCertificate ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving || uploadingThumb}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-green-600 text-sm">✓ Saved</span>}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </div>
  )
}
