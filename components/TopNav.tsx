'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'

type Props = {
  userRole?: string | null
  userName?: string | null
}

export function TopNav({ userRole: serverUserRole, userName: serverUserName }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  // Client-side auth sync: if server rendered "logged out" but client session exists,
  // refresh the page so server re-renders with the correct auth state.
  useEffect(() => {
    if (serverUserRole) return // server already knows we're logged in, nothing to do

    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Server rendered us as logged out, but we have a valid session.
        // Refresh the page so the server can re-render with updated auth.
        router.refresh()
      }
    })
  }, [serverUserRole, router])

  const userRole = serverUserRole
  const userName = serverUserName
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="nav-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            RE
          </div>
          <span className="font-semibold text-foreground hidden sm:block">RE Academy</span>
        </Link>

        {/* Center nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/courses"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/courses')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Courses
          </Link>
          <Link
            href="/paths"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/paths')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Paths
          </Link>
          <Link
            href="/templates"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/templates')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Templates
          </Link>
          {userRole === 'CREATOR' || userRole === 'ADMIN' ? (
            <>
              <Link
                href="/creator"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/creator')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Creator
              </Link>
              <Link
                href="/creator/team"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/creator/team')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Team
              </Link>
            </>
          ) : null}
          {userRole === 'ADMIN' && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {userRole && <NotificationBell />}
          {userRole ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {userName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:block">{userName?.split(' ')[0] ?? 'Dashboard'}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 rounded-xl glass-card border border-border shadow-lg z-50 overflow-hidden">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      Dashboard
                    </Link>
                    <a
                      href="/api/auth/signout"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors border-t border-border"
                    >
                      Sign out
                    </a>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow-blue"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
