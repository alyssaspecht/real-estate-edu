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

export function CourseBrowse({ courses, categories }: { courses: Course[]; categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      const params = new URLSearchParams(window.location.search)
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }
      router.replace(`/courses?${params.toString()}`, { scroll: false })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, router])

  const filtered = courses.filter((c) => {
    const matchesCategory = !selectedCategory || c.category?.id === selectedCategory
    const q = debouncedQuery.trim().toLowerCase()
    const matchesQuery = !q || (
      c.title.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q) ?? false) ||
      (c.creator.name?.toLowerCase().includes(q) ?? false)
    )
    return matchesCategory && matchesQuery
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-500 mt-2 text-lg">
            {courses.length} course{courses.length !== 1 ? 's' : ''} from real estate professionals
          </p>
          <div className="mt-6 relative max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, topic, or instructor…"
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            All Courses
          </button>
          {categories.map((cat) => {
            const count = courses.filter((c) => c.category?.id === cat.id).length
            if (count === 0) return null
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {(selectedCategory || debouncedQuery) && (
          <p className="text-sm text-gray-500 mb-6">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            {debouncedQuery && <> for <span className="font-medium">"{debouncedQuery}"</span></>}
            {selectedCategory && <> in {categories.find(c => c.id === selectedCategory)?.name}</>}
          </p>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-900 font-semibold text-lg mb-1">
              {debouncedQuery ? `No results for "${debouncedQuery}"` : 'No courses in this category yet.'}
            </p>
            <p className="text-gray-500 text-sm mb-4">Try a different keyword or browse all courses.</p>
            <button
              onClick={() => { setQuery(''); setSelectedCategory(null) }}
              className="text-blue-600 hover:underline text-sm"
            >
              View all courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <div
                key={course.id}
                onClick={() => router.push(`/courses/${course.slug}`)}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-white text-4xl">📚</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  {course.category && (
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      {course.category.name}
                    </span>
                  )}
                  <h2 className="font-semibold text-gray-900 mt-1 mb-1 line-clamp-2 leading-snug">
                    {course.title}
                  </h2>
                  <Link
                    href={`/creators/${course.creator.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                  >
                    {course.creator.name ?? 'Unknown instructor'}
                  </Link>
                  {course.reviews.length > 0 && (() => {
                    const avg = course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
                    return (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</span>
                        <span className="text-xs text-gray-500">{avg.toFixed(1)} ({course.reviews.length})</span>
                      </div>
                    )
                  })()}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{course._count.enrollments} students</span>
                    <span className="font-bold text-gray-900">
                      {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
