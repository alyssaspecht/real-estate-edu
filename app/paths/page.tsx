import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PathsPage() {
  const paths = await prisma.learningPath.findMany({
    where: { published: true },
    include: {
      creator: { select: { id: true, name: true } },
      courses: {
        orderBy: { position: 'asc' },
        include: { course: { select: { id: true, title: true, thumbnail: true, price: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/8 backdrop-blur-sm px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground">Learning Paths</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Curated course bundles to take you from beginner to expert
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/courses" className="text-sm text-primary hover:underline">Browse individual courses →</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {paths.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">🛤️</p>
            <p className="text-foreground font-semibold text-lg mb-1">No learning paths yet</p>
            <p className="text-muted-foreground text-sm">Check back soon, or browse individual courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paths.map((path) => {
              const totalValue = path.courses.reduce((s, pc) => s + pc.course.price, 0)
              const savings = totalValue - path.price
              return (
                <Link
                  key={path.id}
                  href={`/paths/${path.slug}`}
                  className="glass-card rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Thumbnail strip */}
                  <div className="h-36 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
                    {path.thumbnail ? (
                      <img src={path.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                    ) : (
                      <div className="flex items-center justify-center h-full gap-2 flex-wrap px-4">
                        {path.courses.slice(0, 3).map(pc => (
                          pc.course.thumbnail ? (
                            <img key={pc.courseId} src={pc.course.thumbnail} className="w-20 h-14 object-cover rounded-lg opacity-70" alt="" />
                          ) : null
                        ))}
                        <span className="text-white text-5xl opacity-40 absolute inset-0 flex items-center justify-center">🛤️</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 text-foreground text-xs font-semibold px-2 py-1 rounded-full">
                        {path.courses.length} course{path.courses.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="font-semibold text-foreground text-lg leading-snug mb-1 group-hover:text-primary transition-colors">
                      {path.title}
                    </h2>
                    {path.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{path.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">by {path.creator.name ?? 'Instructor'}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-lg">
                          {path.price === 0 ? 'Free' : `$${(path.price / 100).toFixed(2)}`}
                        </span>
                        {savings > 0 && totalValue > 0 && (
                          <>
                            <span className="text-muted-foreground line-through text-sm">${(totalValue / 100).toFixed(2)}</span>
                            <span className="text-green-600 text-xs font-semibold">Save ${(savings / 100).toFixed(2)}</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-primary group-hover:underline">View path →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
