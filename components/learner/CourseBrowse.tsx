'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  category: { id: string; name: string } | null
  creator: { id: string; name: string | null }
  _count: { enrollments: number }
  reviews: { rating: number }[]
}

type Category = { id: string; name: string }

const MIN_RATINGS = [0, 3, 3.5, 4, 4.5]
const MIN_RATING_LABELS: Record<number, string> = {
  0: 'Any rating',
  3: '3+ stars',
  3.5: '3.5+ stars',
  4: '4+ stars',
  4.5: '4.5+ stars',
}

export function CourseBrowse({ courses, categories, myCourses, isLoggedIn }: { courses: Course[]; categories: Category[]; myCourses: Course[]; isLoggedIn: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<'my' | 'browse'>(isLoggedIn ? 'my' : 'browse')

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') ?? '')
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>(
    (searchParams.get('price') as 'all' | 'free' | 'paid') ?? 'all'
  )
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get('rating') ?? 0))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (selectedCategory) params.set('cat', selectedCategory)
      if (priceFilter !== 'all') params.set('price', priceFilter)
      if (minRating > 0) params.set('rating', String(minRating))
      const qs = params.toString()
      router.replace(`/courses${qs ? `?${qs}` : ''}`, { scroll: false })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedCategory, priceFilter, minRating, router])

  const hasFilters = !!selectedCategory || priceFilter !== 'all' || minRating > 0 || !!debouncedQuery

  function resetFilters() {
    setQuery('')
    setSelectedCategory('')
    setPriceFilter('all')
    setMinRating(0)
  }

  const sourceCourses = view === 'my' ? myCourses : courses

  const filtered = sourceCourses.filter((c) => {
    if (selectedCategory && c.category?.id !== selectedCategory) return false
    if (priceFilter === 'free' && c.price !== 0) return false
    if (priceFilter === 'paid' && c.price === 0) return false
    if (minRating > 0) {
      if (c.reviews.length === 0) return false
      const avg = c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
      if (avg < minRating) return false
    }
    const q = debouncedQuery.trim().toLowerCase()
    if (q && !(
      c.title.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q) ?? false) ||
      (c.creator.name?.toLowerCase().includes(q) ?? false)
    )) return false
    return true
  })

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/8 px-8 py-12 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground">{view === 'my' ? 'My Courses' : 'Browse Courses'}</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {view === 'my'
              ? `${myCourses.length} course${myCourses.length !== 1 ? 's' : ''} you're enrolled in or created`
              : `${courses.length} course${courses.length !== 1 ? 's' : ''} from real estate professionals`}
          </p>

          {isLoggedIn && (
            <div className="mt-6 inline-flex rounded-lg border border-border overflow-hidden text-sm">
              {(['my', 'browse'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    view === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {v === 'my' ? 'My Courses' : 'Browse All Courses'}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[260px] max-w-xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, topic, or instructor…"
                className="w-full pl-11 pr-10 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`md:hidden flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                priceFilter !== 'all' || minRating > 0 || selectedCategory
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚙ Filters
              {(priceFilter !== 'all' || minRating > 0 || selectedCategory) && (
                <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
                  {[priceFilter !== 'all', minRating > 0, !!selectedCategory].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <div className={`mt-4 flex flex-wrap gap-3 items-center ${filtersOpen ? 'flex' : 'hidden md:flex'}`}>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm">
              {(['all', 'free', 'paid'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPriceFilter(opt)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    priceFilter === opt ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {opt === 'all' ? 'All Prices' : opt === 'free' ? 'Free' : 'Paid'}
                </button>
              ))}
            </div>
            <select
              value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                minRating > 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {MIN_RATINGS.map(r => (
                <option key={r} value={r}>{MIN_RATING_LABELS[r]}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                selectedCategory ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <option value="">All Categories</option>
              {categories
                .filter(cat => courses.some(c => c.category?.id === cat.id))
                .map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
            {hasFilters && (
              <button onClick={resetFilters} className="text-sm text-muted-foreground hover:text-foreground underline">
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                "{debouncedQuery}" <button onClick={() => setQuery('')} className="ml-1 hover:opacity-70">×</button>
              </span>
            )}
            {priceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                {priceFilter === 'free' ? 'Free' : 'Paid'} <button onClick={() => setPriceFilter('all')} className="ml-1 hover:opacity-70">×</button>
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                {MIN_RATING_LABELS[minRating]} <button onClick={() => setMinRating(0)} className="ml-1 hover:opacity-70">×</button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                {categories.find(c => c.id === selectedCategory)?.name} <button onClick={() => setSelectedCategory('')} className="ml-1 hover:opacity-70">×</button>
              </span>
            )}
            <span className="text-xs text-muted-foreground self-center">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            {view === 'my' && !hasFilters ? (
              <>
                <p className="text-4xl mb-3">📚</p>
                <p className="text-foreground font-semibold text-lg mb-1">You haven't enrolled in any courses yet</p>
                <p className="text-muted-foreground text-sm mb-4">Browse our catalog to find your next course.</p>
                <button onClick={() => setView('browse')} className="text-primary hover:underline text-sm">Browse all courses</button>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-foreground font-semibold text-lg mb-1">No courses match your filters</p>
                <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or removing a filter.</p>
                <button onClick={resetFilters} className="text-primary hover:underline text-sm">Clear all filters</button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const avg = course.reviews.length > 0
                ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
                : null
              return (
                <div
                  key={course.id}
                  onClick={() => router.push(`/courses/${course.slug}`)}
                  className="glass-card shimmer-border rounded-2xl overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent flex items-center justify-center">
                        <span className="text-4xl opacity-60">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {course.category && (
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{course.category.name}</span>
                    )}
                    <h2 className="font-semibold text-foreground mt-1 mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{course.title}</h2>
                    <Link
                      href={`/creators/${course.creator.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-primary hover:underline"
                    >
                      {course.creator.name ?? 'Unknown instructor'}
                    </Link>
                    {avg !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</span>
                        <span className="text-xs text-muted-foreground">{avg.toFixed(1)} ({course.reviews.length})</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{course._count.enrollments} students</span>
                      <span className={`font-bold text-sm ${course.price === 0 ? 'text-green-400' : 'text-foreground'}`}>
                        {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
