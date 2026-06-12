'use client'

import { useState, useRef } from 'react'

type Resource = { id: string; name: string; fileUrl: string; type: string }

type Props = {
  lessonId: string
  resources: Resource[]
  onChange: (resources: Resource[]) => void
}

export function ResourceUploader({ lessonId, resources, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ?? 'Upload failed')
      }

      const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE'
      const resRes = await fetch(`/api/lessons/${lessonId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, fileUrl: uploadData.url, type: ext }),
      })
      const resData = await resRes.json()
      if (!resRes.ok) throw new Error(resData.error ?? 'Failed to save resource')

      onChange([...resources, resData.resource])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Remove this file?')) return
    const res = await fetch(`/api/resources/${resourceId}`, { method: 'DELETE' })
    if (res.ok) onChange(resources.filter((r) => r.id !== resourceId))
  }

  return (
    <div className="space-y-3">
      {resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
              <span className="text-sm text-foreground truncate flex-1">📎 {r.name}</span>
              <div className="flex items-center gap-3 ml-3">
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Preview
                </a>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
        <span className="text-sm font-medium text-foreground">
          {uploading ? 'Uploading…' : 'Click to upload a file'}
        </span>
        <span className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, etc.</span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
