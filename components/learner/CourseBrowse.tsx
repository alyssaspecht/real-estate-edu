'use client'

import { useState } from 'react'
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
}

type Category = { id: string; name: string }

export function CourseBrowse({ courses, categories }: { courses: Course[]; categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filtered = selectedCategory
    ? courses.filter((c) => c.category?.id === selectedCategory)
    : courses

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-500 mt-2 text-lg">
            {courses.length} course{courses.length !== 1 ? 's' : ''} from real estate professionals
          </p>
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
        {selectedCategory && (
          <p className="text-sm text-gray-500 mb-6">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''} in {categories.find(c => c.id === selectedCategory)?.name}
          </p>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-500 text-lg">No courses in this category yet.</p>
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              View all courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
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
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{course._count.enrollments} students</span>
                    <span className="font-bold text-gray-900">
                      {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
