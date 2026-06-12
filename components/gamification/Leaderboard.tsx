'use client'

interface LeaderboardUser {
  id: string
  name: string | null
  avatarUrl: string | null
  xp: number
  _count: { enrollments: number }
}

interface LeaderboardProps {
  topUsers: LeaderboardUser[]
  currentUserId?: string
  currentUserRank?: number | null
}

const RANK_STYLES = [
  'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'text-slate-300 bg-slate-400/10 border-slate-400/30',
  'text-amber-600 bg-amber-600/10 border-amber-600/30',
]

export function Leaderboard({ topUsers, currentUserId, currentUserRank }: LeaderboardProps) {
  if (topUsers.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center">
        <p className="text-4xl mb-3">🏆</p>
        <h3 className="font-semibold text-foreground mb-1">Leaderboard</h3>
        <p className="text-sm text-muted-foreground">Complete lessons to earn XP and appear here!</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h3 className="font-semibold text-foreground">Leaderboard</h3>
        <span className="ml-auto text-xs text-muted-foreground">Top learners</span>
      </div>

      <div className="space-y-2">
        {topUsers.map((u, i) => {
          const isMe = u.id === currentUserId
          const rank = i + 1
          const rankStyle = RANK_STYLES[i] ?? 'text-muted-foreground bg-white/5 border-white/10'

          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isMe
                  ? 'bg-primary/10 border border-primary/25 ring-1 ring-primary/20'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* Rank */}
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${rankStyle}`}>
                {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  : (u.name?.[0] ?? '?').toUpperCase()
                }
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                  {u.name ?? 'Learner'} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{u._count.enrollments} course{u._count.enrollments !== 1 ? 's' : ''}</p>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-primary">{u.xp.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current user rank if not in top 10 */}
      {currentUserRank && currentUserRank > 10 && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center text-sm text-muted-foreground">
          Your rank: <span className="text-foreground font-medium">#{currentUserRank}</span>
        </div>
      )}
    </div>
  )
}
