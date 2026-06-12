'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const res = await fetch('/api/profile')
      const data = await res.json()
      if (data.profile) {
        setName(data.profile.name ?? '')
        setHeadline(data.profile.headline ?? '')
        setBio(data.profile.bio ?? '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, headline, bio }),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Update your personal information</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
              {name ? name[0].toUpperCase() : email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{name || email}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Real Estate Agent at eXp Realty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                ✓ Profile saved successfully!
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to dashboard
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
