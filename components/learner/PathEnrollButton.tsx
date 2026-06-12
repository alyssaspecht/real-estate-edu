'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PathEnrollButton({ pathId }: { pathId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleEnroll() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/paths/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathId }),
    })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Enrolling…' : 'Enroll in All Courses'}
      </button>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  )
}
