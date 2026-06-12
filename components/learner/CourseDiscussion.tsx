'use client'

import { useState, useEffect, useRef } from 'react'

type Author = { id: string; name: string | null; avatarUrl: string | null; role: string }

type Reply = {
  id: string
  body: string
  createdAt: string
  author: Author
}

type Thread = {
  id: string
  title: string
  body: string
  pinned: boolean
  createdAt: string
  author: Author
  _count: { replies: number }
}

type Props = {
  courseId: string
  creatorId: string
  currentUserId: string | null
  isEnrolled: boolean
}

function Avatar({ author, size = 8 }: { author: Author; size?: number }) {
  const initials = author.name
    ? author.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  return author.avatarUrl ? (
    <img
      src={author.avatarUrl}
      alt={author.name ?? ''}
      className={`w-${size} h-${size} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ReplyThread({
  thread,
  courseId,
  creatorId,
  currentUserId,
}: {
  thread: Thread
  courseId: string
  creatorId: string
  currentUserId: string | null
}) {
  const [open, setOpen] = useState(false)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function loadReplies() {
    if (loadingReplies) return
    setLoadingReplies(true)
    const res = await fetch(`/api/discussions/replies?discussionId=${thread.id}`)
    if (res.ok) setReplies(await res.json())
    setLoadingReplies(false)
  }

  function handleToggle() {
    if (!open) loadReplies()
    setOpen(o => !o)
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyBody.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/discussions/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discussionId: thread.id, body: replyBody }),
    })
    if (res.ok) {
      const reply = await res.json()
      setReplies(r => [...r, reply])
      setReplyBody('')
    }
    setSubmitting(false)
  }

  async function handleDeleteReply(id: string) {
    await fetch('/api/discussions/replies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setReplies(r => r.filter(r => r.id !== id))
  }

  const isCreator = currentUserId === creatorId

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-colors ${thread.pinned ? 'border-primary/30' : 'border-border'}`}>
      {/* Thread header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Avatar author={thread.author} size={9} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground text-sm">{thread.author.name ?? 'Learner'}</span>
              {thread.author.id === creatorId && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Instructor</span>
              )}
              {thread.pinned && (
                <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-medium">📌 Pinned</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{timeAgo(thread.createdAt)}</span>
            </div>
            <h3 className="font-semibold text-foreground mt-1 leading-snug">{thread.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-4 mt-4 ml-12">
          <button
            onClick={handleToggle}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {thread._count.replies} {thread._count.replies === 1 ? 'reply' : 'replies'}
          </button>

          {/* Pin toggle for creator */}
          {isCreator && (
            <PinButton threadId={thread.id} pinned={thread.pinned} />
          )}
        </div>
      </div>

      {/* Replies */}
      {open && (
        <div className="border-t border-border bg-background/50">
          {loadingReplies ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">Loading replies…</div>
          ) : (
            <div className="divide-y divide-border">
              {replies.map(reply => (
                <div key={reply.id} className="px-6 py-4 flex items-start gap-3">
                  <Avatar author={reply.author} size={7} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{reply.author.name ?? 'Learner'}</span>
                      {reply.author.id === creatorId && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Instructor</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                  </div>
                  {(reply.author.id === currentUserId || isCreator) && (
                    <button
                      onClick={() => handleDeleteReply(reply.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors text-xs shrink-0 mt-0.5"
                      title="Delete reply"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reply box */}
          {currentUserId && (
            <form onSubmit={handleReply} className="px-6 py-4 border-t border-border flex gap-3">
              <textarea
                ref={textareaRef}
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground placeholder:text-muted-foreground"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(e as any)
                }}
              />
              <button
                type="submit"
                disabled={submitting || !replyBody.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors self-end"
              >
                {submitting ? '…' : 'Reply'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function PinButton({ threadId, pinned }: { threadId: string; pinned: boolean }) {
  const [isPinned, setIsPinned] = useState(pinned)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/discussions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: threadId, pinned: !isPinned }),
    })
    if (res.ok) setIsPinned(p => !p)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs flex items-center gap-1 transition-colors ${isPinned ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'}`}
    >
      📌 {isPinned ? 'Unpin' : 'Pin'}
    </button>
  )
}

export function CourseDiscussion({ courseId, creatorId, currentUserId, isEnrolled }: Props) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canPost = isEnrolled || currentUserId === creatorId

  useEffect(() => {
    fetch(`/api/discussions?courseId=${courseId}`)
      .then(r => r.json())
      .then(data => { setThreads(data); setLoading(false) })
  }, [courseId])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newBody.trim() || submitting) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, title: newTitle, body: newBody }),
    })
    if (res.ok) {
      const thread = await res.json()
      setThreads(t => [thread, ...t])
      setNewTitle('')
      setNewBody('')
      setShowForm(false)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/discussions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setThreads(t => t.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Community Discussion</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {threads.length} {threads.length === 1 ? 'thread' : 'threads'} · Ask questions, share wins, help others
          </p>
        </div>
        {canPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Thread
          </button>
        )}
      </div>

      {/* New thread form */}
      {showForm && canPost && (
        <form onSubmit={handlePost} className="bg-card border border-primary/20 rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Start a new thread</h3>
          <input
            type="text"
            placeholder="Thread title (e.g. 'Best way to find seller leads?')"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
          <textarea
            placeholder="Share your question, insight, or experience…"
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            rows={4}
            required
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground placeholder:text-muted-foreground"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError('') }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !newTitle.trim() || !newBody.trim()}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting…' : 'Post Thread'}
            </button>
          </div>
        </form>
      )}

      {/* Not enrolled message */}
      {!canPost && currentUserId && (
        <div className="glass-card rounded-2xl p-5 text-center text-sm text-muted-foreground">
          Enroll in this course to join the discussion.
        </div>
      )}
      {!currentUserId && (
        <div className="glass-card rounded-2xl p-5 text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline font-medium">Sign in</a> and enroll to join the discussion.
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="font-medium text-foreground">No discussions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map(thread => (
            <div key={thread.id} className="relative group">
              <ReplyThread
                thread={thread}
                courseId={courseId}
                creatorId={creatorId}
                currentUserId={currentUserId}
              />
              {/* Delete thread button — creator or author */}
              {(thread.author.id === currentUserId || currentUserId === creatorId) && (
                <button
                  onClick={() => handleDelete(thread.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all text-xs"
                  title="Delete thread"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
