'use client'

import { useState } from 'react'
import Link from 'next/link'

type Course = {
  id: string
  title: string
  status: string
  price: number
  thumbnail: string | null
  category: { name: string } | null
  _count: { enrollments: number }
}

export function CreatorCourseList({ courses }: { courses: Course[] }) {
  const [courseList, setCourseList] = useState(courses)
  const [toggling, setToggling] = useState<string | null>(null)

  const toggleStatus = async (id: string, currentStatus: string) => {
    setToggling(id)
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    const res = await fetch(`/api/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setCourseList(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
      )
    }
    setToggling(null)
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
          <th className="px-6 py-3">Course</th>
          <th className="px-6 py-3">Category</th>
          <th className="px-6 py-3">Price</th>
          <th className="px-6 py-3">Students</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {courseList.map((course) => (
          <tr key={course.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {course.thumbnail ? (
                  <img src={course.thumbnail} className="w-12 h-8 object-cover rounded" alt="" />
                ) : (
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">📚</div>
                )}
                <span className="font-medium text-gray-900 text-sm">{course.title}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-500 text-sm">{course.category?.name ?? '—'}</td>
            <td className="px-6 py-4 text-gray-900 text-sm">
              {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
            </td>
            <td className="px-6 py-4 text-gray-500 text-sm">{course._count.enrollments}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {course.status === 'PUBLISHED' ? 'Published' : 'Draft'}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Link href={`/creator/courses/${course.id}/edit`} className="text-sm text-blue-600 hover:underline">
                  Edit
                </Link>
                <Link href={`/creator/courses/${course.id}/students`} className="text-sm text-gray-500 hover:text-gray-900">
                  Students
                </Link>
                <button
                  onClick={() => toggleStatus(course.id, course.status)}
                  disabled={toggling === course.id}
                  className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50"
                >
                  {toggling === course.id ? '...' : course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
