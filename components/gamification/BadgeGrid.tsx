'use client'

interface Badge {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  earned: boolean
  earnedAt: string | null
}

interface BadgeGridProps {
  badges: Badge[]
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Badges</h3>
        <span className="text-xs text-muted-foreground">
          {earned.length} / {badges.length} earned
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[...earned, ...locked].map(badge => (
          <div
            key={badge.slug}
            className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
              badge.earned
                ? 'bg-primary/10 border border-primary/20 hover:border-primary/40'
                : 'bg-white/5 border border-white/8 opacity-40'
            }`}
            title={badge.earned ? `${badge.name}: ${badge.description}` : `Locked — ${badge.description}`}
          >
            <span className={`text-2xl ${badge.earned ? '' : 'grayscale'}`}>{badge.icon}</span>
            <span className="text-[10px] text-center text-muted-foreground leading-tight">{badge.name}</span>
            {badge.earned && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-background" />
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block w-40 glass-card rounded-lg p-2 text-xs text-center pointer-events-none">
              <p className="font-medium text-foreground">{badge.name}</p>
              <p className="text-muted-foreground mt-0.5">{badge.description}</p>
              {badge.earned && badge.earnedAt && (
                <p className="text-green-400 mt-1">✓ {new Date(badge.earnedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
