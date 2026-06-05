'use client'

import { useState } from 'react'

type Application = {
  id: string
  status: string
  submittedAt: Date
  notes: string | null
  user: { id: string; name: string | null; email: string }
}

export function ApplicationsList({ applications }: { applications: Application[] }) {
  const [list, setList] = useState(applications)
  const [processing, setProcessing] = useState<string | null>(null)

  const handleDecision = async (id: string, userId: string, decision: 'APPROVED' | 'REJECTED') => {
    setProcessing(id)
    const res = await fetch('/api/admin/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: id, userId, decision }),
    })

    if (res.ok) {
      setList(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a))
    }
    setProcessing(null)
  }

  const pending = list.filter(a => a.status === 'PENDING')
  const reviewed = list.filter(a => a.status !== 'PENDING')

  const renderApp = (app: Application) => {
    let details: Record<string, string> = {}
    try { details = JSON.parse(app.notes ?? '{}') } catch {}

    return (
      <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {(app.user.name ?? app.user.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{app.user.name ?? '—'}</p>
                <p className="text-sm text-gray-500">{app.user.email}</p>
              </div>
              <span className={`ml-auto inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {app.status}
              </span>
            </div>

            {details.bio && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Bio</p>
                <p className="text-sm text-gray-700 mt-0.5">{details.bio}</p>
              </div>
            )}
            {details.experience && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Experience</p>
                <p className="text-sm text-gray-700 mt-0.5">{details.experience} years</p>
              </div>
            )}
            {details.topics && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Topics</p>
                <p className="text-sm text-gray-700 mt-0.5">{details.topics}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">
              Submitted {new Date(app.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {app.status === 'PENDING' && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => handleDecision(app.id, app.user.id, 'APPROVED')}
              disabled={processing === app.id}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing === app.id ? 'Processing...' : '✓ Approve'}
            </button>
            <button
              onClick={() => handleDecision(app.id, app.user.id, 'REJECTED')}
              disabled={processing === app.id}
              className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">{pending.map(renderApp)}</div>
        </div>
      )}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Reviewed ({reviewed.length})
          </h2>
          <div className="space-y-4">{reviewed.map(renderApp)}</div>
        </div>
      )}
    </div>
  )
}
