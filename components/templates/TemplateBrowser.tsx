'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNav } from '@/components/TopNav'

type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
}

type Template = {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  previewImageUrl: string | null
  fileType: string | null
  isPlatformItem: boolean
  downloadCount: number
  category: { name: string; slug: string; icon: string }
  creator: { id: string; name: string | null } | null
  _count: { purchases: number }
}

type Props = {
  templates: Template[]
  categories: Category[]
  total: number
  page: number
  pages: number
  activeCategory: string | null
  activeSearch: string | null
  ownedTemplateIds: string[]
  userId: string | null
}

function formatPrice(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

function fileTypeBadgeColor(type: string | null) {
  switch (type) {
    case 'PDF': return 'bg-red-500/15 text-red-400 border-red-500/20'
    case 'DOCX': return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
    case 'PPTX': return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
    case 'XLSX': return 'bg-green-500/15 text-green-400 border-green-500/20'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

export function TemplateBrowser({
  templates,
  categories,
  total,
  page,
  pages,
  activeCategory,
  activeSearch,
  ownedTemplateIds,
  userId,
}: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(activeSearch ?? '')
  const [, startTransition] = useTransition()

  function navigate(params: Record<string, string | null>) {
    const sp = new URLSearchParams()
    if (params.category ?? activeCategory) sp.set('category', (params.category ?? activeCategory)!)
    if (params.search ?? activeSearch) sp.set('search', (params.search ?? activeSearch)!)
    if (params.page) sp.set('page', params.page)
    // Reset page when filtering changes
    if ('category' in params || 'search' in params) sp.delete('page')
    if (params.category === null) sp.delete('category')
    if (params.search === null) sp.delete('search')
    startTransition(() => router.push(`/templates?${sp.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search: searchInput || null })
  }

  return (
    <div className="min-h-screen">
      <TopNav userRole={userId ? 'LEARNER' : undefined} />

      {/* Hero */}
      <div className="border-b border-white/8 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Tools & Templates
              </h1>
              <p className="text-muted-foreground text-lg">
                Professional real estate templates, scripts, and tools — ready to use.
              </p>
            </div>
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search templates..."
                className="w-64 bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
              {activeSearch && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); navigate({ search: null }) }}
                  className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => navigate({ category: null })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                !activeCategory
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate({ category: activeCategory === cat.slug ? null : cat.slug })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat.slug
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {total === 0 ? 'No templates found' : `${total} template${total === 1 ? '' : 's'}`}
            {activeCategory && ` in ${categories.find(c => c.slug === activeCategory)?.name}`}
            {activeSearch && ` matching "${activeSearch}"`}
          </p>
        </div>

        {/* Empty state */}
        {templates.length === 0 && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📂</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates yet</h3>
            <p className="text-muted-foreground">
              {activeSearch || activeCategory
                ? 'Try a different search or category.'
                : 'Check back soon — new templates are added regularly.'}
            </p>
          </div>
        )}

        {/* Grid */}
        {templates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map(t => {
              const owned = ownedTemplateIds.includes(t.id)
              return (
                <Link
                  key={t.id}
                  href={`/templates/${t.slug}`}
                  className="group glass-card shimmer-border rounded-2xl overflow-hidden"
                >
                  {/* Preview image / placeholder */}
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {t.previewImageUrl ? (
                      <img
                        src={t.previewImageUrl}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-40">{t.category.icon}</span>
                      </div>
                    )}
                    {/* File type badge */}
                    {t.fileType && (
                      <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full border ${fileTypeBadgeColor(t.fileType)}`}>
                        {t.fileType}
                      </div>
                    )}
                    {/* Platform badge */}
                    {t.isPlatformItem && (
                      <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                        Official
                      </div>
                    )}
                    {/* Owned badge */}
                    {owned && (
                      <div className="absolute bottom-2 right-2 bg-green-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        ✓ Owned
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t.category.icon} {t.category.name}</p>
                    <h3 className="font-semibold text-foreground/90 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${t.price === 0 ? 'text-green-400' : 'text-foreground'}`}>
                        {formatPrice(t.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t._count.purchases.toLocaleString()} downloads
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {page > 1 && (
              <button
                onClick={() => navigate({ page: String(page - 1) })}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                ← Prev
              </button>
            )}
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <button
                onClick={() => navigate({ page: String(page + 1) })}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
