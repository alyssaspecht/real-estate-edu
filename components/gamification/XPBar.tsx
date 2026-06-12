'use client'

interface XPBarProps {
  xp: number
}

function getLevel(xp: number) {
  if (xp < 100)  return { level: 1, title: 'Newcomer',    next: 100,  color: 'from-slate-400 to-slate-500' }
  if (xp < 250)  return { level: 2, title: 'Explorer',    next: 250,  color: 'from-blue-400 to-blue-500' }
  if (xp < 500)  return { level: 3, title: 'Learner',     next: 500,  color: 'from-cyan-400 to-blue-500' }
  if (xp < 1000) return { level: 4, title: 'Achiever',    next: 1000, color: 'from-violet-400 to-purple-500' }
  if (xp < 2000) return { level: 5, title: 'Expert',      next: 2000, color: 'from-amber-400 to-orange-500' }
  return              { level: 6, title: 'Legend',         next: 9999, color: 'from-yellow-300 to-amber-400' }
}

export function XPBar({ xp }: XPBarProps) {
  const { level, title, next, color } = getLevel(xp)
  const prevThreshold = level === 1 ? 0 : [0, 100, 250, 500, 1000, 2000][level - 1]
  const progress = Math.min(((xp - prevThreshold) / (next - prevThreshold)) * 100, 100)

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level {level}</span>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{xp.toLocaleString()}</span>
          <p className="text-xs text-muted-foreground">XP total</p>
        </div>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-muted-foreground">{xp} XP</span>
        <span className="text-xs text-muted-foreground">{next} XP to Level {level + 1}</span>
      </div>
    </div>
  )
}
