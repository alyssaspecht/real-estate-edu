'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string; slug: string; icon: string }

type ExistingTemplate = {
  slug: string
  title: string
  description: string | null
  longDescription: string | null
  price: number
  categoryId: string
  fileUrl: string | null
  templateLinkUrl: string | null
  deliveryType: string
  previewImageUrl: string | null
  fileType: string | null
  fileSize: number | null
  status: string
  isPlatformItem: boolean
  categoryNote: string | null
}

type Props = { categories: Category[]; isAdmin: boolean; template?: ExistingTemplate }

// Detect what platform a link is from
function detectLinkPlatform(url: string): { label: string; icon: string } | null {
  if (!url) return null
  if (url.includes('canva.com'))        return { label: 'Canva Template',        icon: '🎨' }
  if (url.includes('docs.google.com'))  return { label: 'Google Doc/Slides',     icon: '📑' }
  if (url.includes('notion.so') || url.includes('notion.site')) return { label: 'Notion Template', icon: '📓' }
  if (url.includes('figma.com'))        return { label: 'Figma Template',        icon: '🖌️' }
  if (url.includes('airtable.com'))     return { label: 'Airtable Template',     icon: '📋' }
  if (url.startsWith('http'))           return { label: 'External Template Link', icon: '🔗' }
  return null
}

export function TemplateForm({ categories, isAdmin, template }: Props) {
  const router = useRouter()
  const isEdit = !!template

  const [title, setTitle]               = useState(template?.title ?? '')
  const [description, setDescription]   = useState(template?.description ?? '')
  const [longDescription, setLongDescription] = useState(template?.longDescription ?? '')
  const [price, setPrice]               = useState(template ? (template.price / 100).toFixed(2) : '0.00')
  const [categoryId, setCategoryId]     = useState(template?.categoryId ?? '')
  const [categoryNote, setCategoryNote] = useState(template?.categoryNote ?? '')

  // Delivery type toggle
  const [deliveryType, setDeliveryType] = useState<'FILE' | 'LINK'>(
    (template?.deliveryType as 'FILE' | 'LINK') ?? 'FILE'
  )

  // File delivery
  const [fileUrl, setFileUrl]     = useState(template?.fileUrl ?? '')
  const [fileType, setFileType]   = useState(template?.fileType ?? '')
  const [fileSize, setFileSize]   = useState(template?.fileSize ?? 0)
  const [fileName, setFileName]   = useState('')

  // Link delivery
  const [templateLinkUrl, setTemplateLinkUrl] = useState(template?.templateLinkUrl ?? '')

  const [previewImageUrl, setPreviewImageUrl] = useState(template?.previewImageUrl ?? '')
  const [status, setStatus]           = useState(template?.status ?? 'DRAFT')
  const [isPlatformItem, setIsPlatformItem] = useState(template?.isPlatformItem ?? false)

  const [uploadingFile, setUploadingFile]   = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  async function uploadFile(file: File, isPreview = false) {
    const endpoint = isPreview ? '/api/upload' : '/api/upload/template-file'
    const formData = new FormData()
    formData.append('file', file)
    if (isPreview) setUploadingImage(true); else setUploadingFile(true)
    const res = await fetch(endpoint, { method: 'POST', body: formData })
    const data = await res.json()
    if (isPreview) setUploadingImage(false); else setUploadingFile(false)
    if (!res.ok) { setError(data.error ?? 'Upload failed'); return null }
    return data
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await uploadFile(file)
    if (data) { setFileUrl(data.url); setFileType(data.fileType); setFileSize(data.fileSize); setFileName(data.fileName) }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await uploadFile(file, true)
    if (data?.url) setPreviewImageUrl(data.url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) { setError('Title is required'); return }
    if (!categoryId) { setError('Please select a category'); return }
    if (deliveryType === 'LINK' && !templateLinkUrl.trim()) {
      setError('Please paste your template link'); return
    }

    const priceCents = Math.round(parseFloat(price || '0') * 100)
    setSaving(true)

    const body = {
      title,
      description: description || null,
      longDescription: longDescription || null,
      price: priceCents,
      categoryId,
      categoryNote: categoryNote || null,
      deliveryType,
      fileUrl: deliveryType === 'FILE' ? (fileUrl || null) : null,
      templateLinkUrl: deliveryType === 'LINK' ? (templateLinkUrl || null) : null,
      previewImageUrl: previewImageUrl || null,
      fileType: deliveryType === 'FILE' ? (fileType || null) : null,
      fileSize: deliveryType === 'FILE' ? (fileSize || null) : null,
      isPlatformItem,
      ...(isEdit && { status }),
    }

    const res = isEdit
      ? await fetch(`/api/templates/${template!.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
    router.push('/creator/templates')
    router.refresh()
  }

  async function handlePublish() {
    if (!template) return
    setSaving(true)
    await fetch(`/api/templates/${template.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PUBLISHED' }) })
    setSaving(false)
    router.push('/creator/templates')
    router.refresh()
  }

  async function handleDelete() {
    if (!template) return
    if (!confirm('Delete this template? This cannot be undone.')) return
    await fetch(`/api/templates/${template.slug}`, { method: 'DELETE' })
    router.push('/creator/templates')
    router.refresh()
  }

  function formatBytes(bytes: number) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const linkPlatform = detectLinkPlatform(templateLinkUrl)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Title <span className="text-destructive">*</span></label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Digital Local Guide — Downtown Neighborhood"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category <span className="text-destructive">*</span></label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">Select a category...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        {/* Category suggestion */}
        <div className="mt-2">
          <input
            value={categoryNote}
            onChange={e => setCategoryNote(e.target.value)}
            placeholder="Don't see the right category? Suggest one (optional — we'll consider adding it)"
            className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Short Description</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="One-line description shown in the catalog"
          maxLength={200}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Long description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Full Description</label>
        <textarea
          value={longDescription}
          onChange={e => setLongDescription(e.target.value)}
          placeholder="Describe what's included, how to use it, who it's for..."
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Price (USD)</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number" min="0" step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <button type="button" onClick={() => setPrice('0.00')} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
            Set Free
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Set to $0.00 to offer for free</p>
      </div>

      {/* ── Delivery Type Toggle ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">How will buyers receive this?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryType('FILE')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              deliveryType === 'FILE'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-white/10 bg-white/3 text-muted-foreground hover:border-white/20'
            }`}
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium">File Download</span>
            <span className="text-xs text-center opacity-70">PDF, DOCX, PPTX, ZIP</span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('LINK')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              deliveryType === 'LINK'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-white/10 bg-white/3 text-muted-foreground hover:border-white/20'
            }`}
          >
            <span className="text-2xl">🎨</span>
            <span className="text-sm font-medium">Template Link</span>
            <span className="text-xs text-center opacity-70">Canva, Google Slides, Notion...</span>
          </button>
        </div>
      </div>

      {/* File upload (shown when FILE selected) */}
      {deliveryType === 'FILE' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Template File</label>
          {fileUrl ? (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{fileType || '?'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{fileName || 'Uploaded file'}</p>
                {fileSize > 0 && <p className="text-xs text-muted-foreground">{formatBytes(fileSize)}</p>}
              </div>
              <button type="button" onClick={() => { setFileUrl(''); setFileType(''); setFileSize(0); setFileName('') }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 rounded-xl p-8 cursor-pointer hover:border-primary/40 transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-2xl">📤</span>
              <span className="text-sm text-muted-foreground text-center">{uploadingFile ? 'Uploading…' : 'Click to upload PDF, DOCX, PPTX, XLSX, or ZIP'}</span>
              <span className="text-xs text-muted-foreground">Max 50MB</span>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" onChange={handleFileChange} disabled={uploadingFile} />
            </label>
          )}
        </div>
      )}

      {/* Template link (shown when LINK selected) */}
      {deliveryType === 'LINK' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Template Link</label>

          {/* How-to callout */}
          <div className="mb-3 p-4 bg-primary/8 border border-primary/20 rounded-xl text-sm">
            <p className="font-medium text-foreground mb-2">🎨 How to get your Canva share link:</p>
            <ol className="text-muted-foreground space-y-1 text-xs list-decimal ml-4">
              <li>Open your design in Canva</li>
              <li>Click <strong className="text-foreground">Share</strong> → <strong className="text-foreground">Template link</strong></li>
              <li>Copy the link and paste it below</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">Works with Canva, Google Slides, Notion, Figma, and any shareable link.</p>
          </div>

          <input
            type="url"
            value={templateLinkUrl}
            onChange={e => setTemplateLinkUrl(e.target.value)}
            placeholder="https://www.canva.com/design/..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />

          {/* Platform detection */}
          {linkPlatform && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
              <span>{linkPlatform.icon}</span>
              <span>{linkPlatform.label} detected ✓</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            🔒 This link is kept private — buyers only see it after purchasing.
          </p>
        </div>
      )}

      {/* Preview image */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Preview Image</label>
        {previewImageUrl ? (
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
            <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setPreviewImageUrl('')} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/80 transition-colors">Remove</button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 rounded-xl p-8 cursor-pointer hover:border-primary/40 transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-2xl">🖼️</span>
            <span className="text-sm text-muted-foreground text-center">{uploadingImage ? 'Uploading…' : 'Click to upload a preview image'}</span>
            <span className="text-xs text-muted-foreground">PNG or JPG — shown in the catalog</span>
            <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleImageChange} disabled={uploadingImage} />
          </label>
        )}
      </div>

      {/* Admin: platform item toggle */}
      {isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <input type="checkbox" id="platformItem" checked={isPlatformItem} onChange={e => setIsPlatformItem(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
          <label htmlFor="platformItem" className="text-sm text-foreground">
            <span className="font-medium">Official RE Academy template</span>
            <span className="text-muted-foreground ml-1">(shown with "Official" badge, listed first)</span>
          </label>
        </div>
      )}

      {/* Status (edit only) */}
      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving || uploadingFile || uploadingImage} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
        </button>
        {!isEdit && <p className="text-xs text-muted-foreground">Saved as Draft — publish when ready</p>}
        {isEdit && template?.status === 'DRAFT' && (
          <button type="button" onClick={handlePublish} disabled={saving} className="bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-colors disabled:opacity-50">
            Publish
          </button>
        )}
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={saving} className="ml-auto text-sm text-muted-foreground hover:text-destructive transition-colors">
            Delete template
          </button>
        )}
      </div>
    </form>
  )
}
