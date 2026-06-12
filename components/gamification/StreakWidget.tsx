'use client'

interface StreakWidgetProps {
  current: number
  longest: number
}

export function StreakWidget({ current, longest }: StreakWidgetProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().getDay() // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xl">
          🔥
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Daily Streak</h3>
          <p className="text-xs text-muted-foreground">Keep learning every day!</p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-3xl font-bold text-orange-400">{current}</span>
          <p className="text-xs text-muted-foreground">day{current !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Day dots */}
      <div className="flex justify-between mb-3">
        {days.map((day, i) => {
          const active = current > 0 && i <= todayIdx && i >= todayIdx - (current - 1)
          const isToday = i === todayIdx
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                active
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : isToday
                  ? 'bg-white/10 border border-dashed border-white/30 text-muted-foreground'
                  : 'bg-white/5 text-muted-foreground/50'
              }`}>
                {active ? '🔥' : '·'}
              </div>
              <span className={`text-[10px] ${isToday ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{day}</span>
            </div>
          )
        })}
      </div>

      <div className="pt-3 border-t border-white/10 flex justify-between text-xs text-muted-foreground">
        <span>🏅 Longest: <span className="text-foreground font-medium">{longest} days</span></span>
        {current >= 3 && <span className="text-orange-400 font-medium">🔥 On fire!</span>}
        {current === 0 && <span>Start today to begin your streak!</span>}
      </div>
    </div>
  )
}
