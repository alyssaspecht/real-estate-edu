'use client'

import { useState } from 'react'
import { CurriculumBuilder } from '@/components/admin/CurriculumBuilder'
import { CourseSettingsForm } from './CourseSettingsForm'

type Category = { id: string; name: string }

type Lesson = {
  id: string
  title: string
  type: string
  position: number
}

type Module = {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  description: string | null
  price: number
  thumbnail: string | null
  categoryId: string | null
  status: string
  modules: Module[]
}

type Props = {
  course: Course
  categories: Category[]
  onStatusChange?: (newStatus: string) => void
}

export function CreatorCourseEditor({ course, categories }: Props) {
  const [tab, setTab] = useState<'curriculum' | 'settings'>('curriculum')
  const [status, setStatus] = useState(course.status)
  const [toggling, setToggling] = useState(false)

  const togglePublish = async () => {
    setToggling(true)
    const newStatus = status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    const res = await fetch(`/api/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setStatus(newStatus)
    setToggling(false)
  }

  return (
    <div>
      {/* Status + publish toggle */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {status === 'PUBLISHED' ? 'Published' : 'Draft'}
        </span>
        <button
          onClick={togglePublish}
          disabled={toggling}
          className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            status === 'PUBLISHED'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {toggling ? '…' : status === 'PUBLISHED' ? 'Unpublish' : 'Publish Course'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['curriculum', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'curriculum' && <CurriculumBuilder course={course} />}
      {tab === 'settings' && (
        <CourseSettingsForm course={course} categories={categories} />
      )}
    </div>
  )
}
