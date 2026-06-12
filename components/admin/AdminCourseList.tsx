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
  creator: { id: string; name: string | null }
  _count: { enrollments: number }
}

export function AdminCourseList({ courses }: { courses: Course[] }) {
  const [courseList, setCourseList] = useState(courses)

  const toggleStatus = async (id: string, currentStatus: string) => {
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
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-gray-50">
          <th className="px-6 py-3">Course</th>
          <th className="px-6 py-3">Creator</th>
          <th className="px-6 py-3">Category</th>
          <th className="px-6 py-3">Price</th>
          <th className="px-6 py-3">Students</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {courseList.map((course) => (
          <tr key={course.id} className="hover:bg-muted">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {course.thumbnail ? (
                  <img src={course.thumbnail} className="w-12 h-8 object-cover rounded" alt="" />
                ) : (
                  <div className="w-12 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                    No img
                  </div>
                )}
                <span className="font-medium text-foreground">{course.title}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-muted-foreground text-sm">
              <Link href={`/creators/${course.creator.id}`} className="hover:text-primary hover:underline">
                {course.creator.name ?? '—'}
              </Link>
            </td>
            <td className="px-6 py-4 text-muted-foreground text-sm">
              {course.category?.name ?? '—'}
            </td>
            <td className="px-6 py-4 text-foreground text-sm">
              {course.price === 0 ? 'Free' : `$${(course.price / 100).toFixed(2)}`}
            </td>
            <td className="px-6 py-4 text-muted-foreground text-sm">
              {course._count.enrollments}
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                course.status === 'PUBLISHED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {course.status === 'PUBLISHED' ? 'Published' : 'Draft'}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/courses/${course.id}/edit`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => toggleStatus(course.id, course.status)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
