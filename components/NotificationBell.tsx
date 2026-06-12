'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  linkUrl: string | null
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Poll for new notifications every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }
  }

  async function handleOpen() {
    setOpen(o => !o)
  }

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(n => n.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    setLoading(false)
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(n => n.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-2xl shadow-xl shadow-black/20 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {n.linkUrl ? (
                      <Link
                        href={n.linkUrl}
                        onClick={() => { markRead(n.id); setOpen(false) }}
                        className="block"
                      >
                        <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-foreground' : 'text-foreground'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                      </Link>
                    ) : (
                      <div onClick={() => markRead(n.id)} className="cursor-pointer">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-foreground' : 'text-foreground'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
