import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getUser'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CreatorTemplatesPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) redirect('/dashboard')

  const templates = await prisma.template.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true, icon: true } },
      _count: { select: { purchases: true } },
    },
  })

  function formatPrice(cents: number) {
    return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">← Creator Dashboard</Link>
            <h1 className="text-2xl font-bold text-foreground">My Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">Sell your templates and tools to other agents</p>
          </div>
          <Link
            href="/creator/templates/new"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors glow-blue"
          >
            + New Template
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-2xl">
            <p className="text-4xl mb-4">📄</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Upload your first template — buyer presentations, net sheets, scripts, and more.</p>
            <Link
              href="/creator/templates/new"
              className="inline-flex bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Upload a Template
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary/20 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                  {t.category.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-foreground text-sm truncate">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      t.status === 'PUBLISHED'
                        ? 'bg-green-500/15 text-green-400'
                        : t.status === 'ARCHIVED'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.category.name} · {formatPrice(t.price)}</p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{t._count.purchases}</p>
                  <p className="text-xs text-muted-foreground">downloads</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {t.status === 'PUBLISHED' && (
                    <Link
                      href={`/templates/${t.slug}`}
                      className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                      target="_blank"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/creator/templates/${t.slug}/edit`}
                    className="text-xs bg-muted hover:bg-secondary text-foreground px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
