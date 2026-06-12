import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CreatorPathsPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) notFound()

  const paths = await prisma.learningPath.findMany({
    where: { creatorId: user.id },
    include: {
      courses: {
        orderBy: { position: 'asc' },
        include: { course: { select: { title: true, price: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">← Creator Dashboard</Link>
            <h1 className="text-3xl font-bold text-foreground">Learning Paths</h1>
            <p className="text-muted-foreground mt-1">Bundle your courses into curated learning paths</p>
          </div>
          <Link
            href="/creator/paths/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Path
          </Link>
        </div>

        {paths.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🛤️</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">No learning paths yet</h3>
            <p className="text-muted-foreground mb-6">Group your courses into a bundle and offer a discounted price.</p>
            <Link href="/creator/paths/new" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Create Your First Path
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {paths.map(path => {
              const totalValue = path.courses.reduce((s, pc) => s + pc.course.price, 0)
              return (
                <div key={path.id} className="glass-card rounded-2xl p-6 flex gap-5 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-foreground">{path.title}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        path.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {path.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{path.courses.length} course{path.courses.length !== 1 ? 's' : ''}</span>
                      <span>{path.price === 0 ? 'Free' : `$${(path.price / 100).toFixed(2)}`}</span>
                      {totalValue > path.price && totalValue > 0 && (
                        <span className="text-green-600 text-xs">Saves ${((totalValue - path.price) / 100).toFixed(2)}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {path.courses.map(pc => (
                        <span key={pc.courseId} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full line-clamp-1 max-w-[160px]">
                          {pc.course.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {path.published && (
                      <Link href={`/paths/${path.slug}`} className="text-xs text-primary hover:underline px-3 py-2">
                        View
                      </Link>
                    )}
                    <Link
                      href={`/creator/paths/${path.id}/edit`}
                      className="bg-muted text-foreground px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
