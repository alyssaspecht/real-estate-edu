'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopNav } from '@/components/TopNav'

type Template = {
  id: string
  slug: string
  title: string
  description: string | null
  longDescription: string | null
  price: number
  fileUrl: string | null
  templateLinkUrl: string | null
  deliveryType: string
  previewImageUrl: string | null
  fileType: string | null
  fileSize: number | null
  isPlatformItem: boolean
  downloadCount: number
  publishedAt: Date | null | string
  category: { id: string; name: string; slug: string; icon: string }
  creator: { id: string; name: string | null; avatarUrl: string | null } | null
  _count: { purchases: number }
}

type Props = {
  template: Template
  isOwned: boolean
  userId: string | null
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatPrice(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

export function TemplateDetail({ template, isOwned, userId }: Props) {
  const [loading, setLoading] = useState(false)
  const [owned, setOwned] = useState(isOwned)
  const [error, setError] = useState<string | null>(null)

  const isLinkDelivery = template.deliveryType === 'LINK'

  async function accessTemplate() {
    const res = await fetch(`/api/templates/${template.slug}/download`)
    const data = await res.json()
    if (data.type === 'link' && data.url) {
      window.open(data.url, '_blank', 'noopener')
    } else if (!data.type) {
      // file redirect — shouldn't happen with fetch but handle gracefully
      window.location.href = `/api/templates/${template.slug}/download`
    }
  }

  async function handleGetTemplate() {
    if (!userId) {
      window.location.href = `/login?next=/templates/${template.slug}`
      return
    }
    if (owned) {
      await accessTemplate()
      return
    }

    setLoading(true)
    setError(null)

    // Paid template — go through Stripe Checkout
    if (template.price > 0) {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'template', templateId: template.id }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setError(data.error ?? 'Something went wrong'); setLoading(false) }
      return
    }

    // Free template — instant purchase then access
    const res = await fetch(`/api/templates/${template.slug}/purchase`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(false); return }
    setOwned(true)
    setLoading(false)
    await accessTemplate()
  }

  const isFree = template.price === 0

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole={userId ? 'LEARNER' : undefined} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/templates" className="hover:text-foreground transition-colors">Tools & Templates</Link>
          <span>/</span>
          <Link href={`/templates?category=${template.category.slug}`} className="hover:text-foreground transition-colors">
            {template.category.icon} {template.category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{template.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview image */}
            {template.previewImageUrl ? (
              <div className="rounded-2xl overflow-hidden border border-border aspect-[16/9] bg-muted">
                <img
                  src={template.previewImageUrl}
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-border aspect-[16/9] bg-muted flex items-center justify-center">
                <span className="text-7xl opacity-20">{template.category.icon}</span>
              </div>
            )}

            {/* Description */}
            {template.longDescription && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">About this template</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                  {template.longDescription}
                </div>
              </div>
            )}

            {/* What's included */}
            <div className="bg-muted/40 border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">What's included</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {isLinkDelivery ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>🎨</span>
                    <span>Editable template link (Canva / Google Slides / Notion)</span>
                  </div>
                ) : (
                  <>
                    {template.fileType && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>📄</span>
                        <span>{template.fileType} file</span>
                      </div>
                    )}
                    {template.fileSize && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>💾</span>
                        <span>{formatBytes(template.fileSize)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>⬇️</span>
                      <span>Instant download</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>♾️</span>
                  <span>Lifetime access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — purchase card */}
          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-6 sticky top-6">
              {/* Title */}
              <h1 className="text-xl font-bold text-foreground mb-1">{template.title}</h1>
              <p className="text-xs text-muted-foreground mb-4">
                {template.category.icon} {template.category.name}
                {template.isPlatformItem && (
                  <span className="ml-2 bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                    Official
                  </span>
                )}
              </p>

              {template.description && (
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{template.description}</p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-5">
                <span className={`text-3xl font-bold ${isFree ? 'text-green-400' : 'text-foreground'}`}>
                  {formatPrice(template.price)}
                </span>
                {isFree && <span className="text-sm text-muted-foreground">· No sign-up required</span>}
              </div>

              {/* Payment notice */}
              {/* Error */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleGetTemplate}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  owned
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-blue'
                }`}
              >
                {loading
                  ? 'Processing…'
                  : owned
                    ? isLinkDelivery ? '🎨 Open Template' : '⬇️ Download Template'
                    : isFree
                      ? isLinkDelivery ? '🎨 Get Template Free' : '⬇️ Get for Free'
                      : `Buy for ${formatPrice(template.price)}`
                }
              </button>

              {!userId && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  <Link href={`/login?next=/templates/${template.slug}`} className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to access your downloads from any device
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border text-xs text-muted-foreground">
                <span>⬇️ {template._count.purchases.toLocaleString()} downloads</span>
                {template.publishedAt && (
                  <span>Added {new Date(template.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                )}
              </div>

              {/* Creator */}
              {template.creator && !template.isPlatformItem && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {template.creator.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created by</p>
                    <p className="text-sm font-medium text-foreground">{template.creator.name}</p>
                  </div>
                </div>
              )}
              {template.isPlatformItem && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    RE
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created by</p>
                    <p className="text-sm font-medium text-foreground">RE Academy</p>
                  </div>
                </div>
              )}
            </div>

            {/* Back link */}
            <Link
              href={`/templates?category=${template.category.slug}`}
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← More {template.category.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
