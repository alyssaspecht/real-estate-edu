'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  courseId: string
  slug: string
  firstLessonId: string | null
  price: number
}

export function EnrollButton({ courseId, slug, firstLessonId, price }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEnroll = async () => {
    setLoading(true)
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    })

    if (res.ok && firstLessonId) {
      router.push(`/courses/${slug}/lessons/${firstLessonId}`)
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Enrolling...' : price === 0 ? 'Enroll for Free' : `Enroll — $${(price / 100).toFixed(2)}`}
    </button>
  )
}
