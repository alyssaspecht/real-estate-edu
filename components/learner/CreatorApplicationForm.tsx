'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CreatorApplicationForm() {
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [topics, setTopics] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/creator-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, experience, topics }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h2>
        <p className="text-muted-foreground">We'll review your application and get back to you soon.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Creator Application</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Professional Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Tell us about your real estate background and experience..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select experience level</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            What topics would you teach? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="e.g. Lead generation, listing presentations, negotiation strategies..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
