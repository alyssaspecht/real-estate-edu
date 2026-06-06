'use client'

import { useState } from 'react'

type User = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
  _count?: { enrollments: number }
}

export function AdminUserTable({ users }: { users: User[] }) {
  const [userList, setUserList] = useState(users)
  const [saving, setSaving] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(userId)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })

    if (res.ok) {
      setUserList(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      )
    }
    setSaving(null)
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
          <th className="px-6 py-3">Name</th>
          <th className="px-6 py-3">Email</th>
          <th className="px-6 py-3">Role</th>
          <th className="px-6 py-3">Enrollments</th>
          <th className="px-6 py-3">Joined</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {userList.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">
              {user.name ?? '—'}
            </td>
            <td className="px-6 py-4 text-gray-500 text-sm">{user.email}</td>
            <td className="px-6 py-4">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                disabled={saving === user.id}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LEARNER">Learner</option>
                <option value="CREATOR">Creator</option>
                <option value="ADMIN">Admin</option>
              </select>
              {saving === user.id && (
                <span className="ml-2 text-xs text-gray-400">Saving...</span>
              )}
            </td>
            <td className="px-6 py-4 text-gray-500 text-sm">
              {user._count?.enrollments ?? 0}
            </td>
            <td className="px-6 py-4 text-gray-500 text-sm">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
