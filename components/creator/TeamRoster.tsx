'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Assignment = { courseId: string; courseTitle: string; total: number; completed: number }
type Member = { id: string; name: string | null; email: string; assignments: Assignment[] }
type Course = { id: string; title: string }

export function TeamRoster({ initialMembers, courses }: { initialMembers: Member[]; courses: Course[] }) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [addText, setAddText] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)

  const handleAddMembers = async () => {
    if (!addText.trim()) return
    setAdding(true)
    setError('')

    const res = await fetch('/api/team/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: addText }),
    })
    const data = await res.json()

    if (res.ok) {
      setAddText('')
      router.refresh()
      // Refetch roster
      const listRes = await fetch('/api/team/members')
      const listData = await listRes.json()
      if (listRes.ok) {
        setMembers(
          listData.members.map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            assignments: members.find((existing) => existing.id === m.id)?.assignments ?? [],
          }))
        )
      }
    } else {
      setError(data.error ?? 'Failed to add team members')
    }
    setAdding(false)
  }

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    if (selectedMembers.size === 0 || selectedCourses.size === 0) return
    setAssigning(true)
    setError('')

    const res = await fetch('/api/team/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberIds: Array.from(selectedMembers),
        courseIds: Array.from(selectedCourses),
      }),
    })
    const data = await res.json()

    if (res.ok) {
      setSelectedMembers(new Set())
      setSelectedCourses(new Set())
      router.refresh()
      const listRes = await fetch('/api/team/members')
      const listData = await listRes.json()
      // Full reload to pick up fresh progress data is simplest here
      if (listRes.ok) window.location.reload()
    } else {
      setError(data.error ?? 'Failed to assign courses')
    }
    setAssigning(false)
  }

  return (
    <div className="space-y-6">
      {/* Add members */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Add team members</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Paste one person per line — name and email, or just an email.
        </p>
        <textarea
          value={addText}
          onChange={(e) => setAddText(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder={'Jane Smith, jane@example.com\njohn@example.com'}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={handleAddMembers} disabled={adding || !addText.trim()}>
            {adding ? 'Adding…' : 'Add to team'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Assign courses */}
      {members.length > 0 && courses.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Assign courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Team members</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                    />
                    <span>{m.name || m.email}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Courses</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {courses.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedCourses.has(c.id)}
                      onChange={() => toggleCourse(c.id)}
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleAssign} disabled={assigning || selectedMembers.size === 0 || selectedCourses.size === 0}>
              {assigning ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </div>
      )}

      {/* Roster + progress */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Roster ({members.length})</h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet — add some above.</p>
        ) : (
          <div className="space-y-4">
            {members.map((m) => (
              <div key={m.id} className="border border-border rounded-xl p-4">
                <p className="font-medium text-foreground">{m.name || '(no name)'}</p>
                <p className="text-sm text-muted-foreground mb-2">{m.email}</p>
                {m.assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No courses assigned yet</p>
                ) : (
                  <div className="space-y-1">
                    {m.assignments.map((a) => (
                      <div key={a.courseId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{a.courseTitle}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          a.total > 0 && a.completed === a.total
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {a.completed}/{a.total} lessons
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
