'use client'

import { useEffect, useState } from 'react'

interface XPToastProps {
  xpEarned: number
  newBadges: string[]
  streak: { current: number }
  onDone: () => void
}

// Map badge slugs to display info
const BADGE_INFO: Record<string, { icon: string; name: string }> = {
  'first-lesson':   { icon: '🎯', name: 'First Step' },
  'first-course':   { icon: '🎓', name: 'Graduate' },
  'three-courses':  { icon: '📚', name: 'Scholar' },
  'streak-3':       { icon: '🔥', name: 'On a Roll' },
  'streak-7':       { icon: '⚡', name: 'Week Warrior' },
  'streak-30':      { icon: '💎', name: 'Unstoppable' },
  'xp-100':         { icon: '⭐', name: 'Rising Star' },
  'xp-500':         { icon: '🚀', name: 'High Achiever' },
  'xp-1000':        { icon: '🏆', name: 'Legend' },
  'first-template': { icon: '🛠️', name: 'Equipped' },
}

export function XPToast({ xpEarned, newBadges, streak, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50)
    // Animate out
    const t2 = setTimeout(() => setVisible(false), 3000)
    const t3 = setTimeout(onDone, 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 flex flex-col gap-2 transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* XP notification */}
      <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3 min-w-[200px]">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="text-sm font-bold text-primary">+{xpEarned} XP</p>
          {streak.current > 1 && (
            <p className="text-xs text-muted-foreground">🔥 {streak.current}-day streak!</p>
          )}
        </div>
      </div>

      {/* Badge notifications */}
      {newBadges.map(slug => {
        const info = BADGE_INFO[slug]
        if (!info) return null
        return (
          <div key={slug} className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3 border-primary/30">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground">Badge Unlocked!</p>
              <p className="text-sm font-bold text-foreground">{info.name}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
