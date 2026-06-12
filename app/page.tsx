import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getUser'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  const [featuredCourses, stats] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        creator: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    Promise.all([
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.enrollment.count(),
    ]),
  ])

  const [courseCount, userCount, enrollmentCount] = stats

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-8 py-32 text-center">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            The #1 Real Estate Education Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.08] tracking-tight mb-6">
            Master Real Estate.{' '}
            <span className="gradient-text">
              Accelerate Your Career.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Learn from top agents, brokers, and industry experts. Build skills that close more deals, grow your income, and scale your business.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {user ? (
              <>
                <Link href="/courses" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-primary/90 transition-all glow-blue">
                  Browse Courses
                </Link>
                <Link href="/dashboard" className="glass-card text-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:border-primary/30 transition-all">
                  My Dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-primary/90 transition-all glow-blue">
                  Start Learning Free
                </Link>
                <Link href="/courses" className="glass-card text-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:border-primary/30 transition-all">
                  Browse Courses →
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-14 flex-wrap">
            {[
              { value: `${courseCount}+`, label: 'Courses' },
              { value: `${userCount.toLocaleString()}+`, label: 'Students' },
              { value: `${enrollmentCount.toLocaleString()}+`, label: 'Enrollments' },
              { value: '4.9★', label: 'Avg Rating' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10 bg-white/10" />}
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you'll learn ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need to succeed</h2>
          <p className="text-muted-foreground text-lg">From licensing basics to advanced investment strategies</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: '🏡', title: 'Agent Fundamentals',    desc: 'Contracts, listings, negotiations, and everything a new agent needs to hit the ground running.' },
            { icon: '📈', title: 'Investment & Finance',   desc: 'Analyze deals, understand cap rates, leverage, and build a rental portfolio step by step.' },
            { icon: '🤝', title: 'Business Development',   desc: 'Lead generation, sphere of influence, social media, and scaling a real estate team.' },
            { icon: '⚖️', title: 'Legal & Compliance',     desc: 'Fair housing, disclosure laws, risk management — stay compliant and protect your clients.' },
            { icon: '🏢', title: 'Commercial Real Estate', desc: 'Office, retail, industrial, multifamily — deep dives into the commercial asset classes.' },
            { icon: '🎓', title: 'CE Credits',             desc: 'Satisfy continuing education requirements with our state-approved courses.' },
          ].map((item) => (
            <div key={item.title} className="glass-card shimmer-border rounded-2xl p-6 group cursor-default">
              <span className="text-3xl mb-4 block">{item.icon}</span>
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────────── */}
      {featuredCourses.length > 0 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Featured Courses</h2>
                <p className="text-muted-foreground">Handpicked by our team for quality and relevance</p>
              </div>
              <Link href="/courses" className="text-primary hover:underline text-sm font-medium">View all →</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="glass-card shimmer-border rounded-2xl overflow-hidden group block"
                >
                  <div className="h-40 overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl">📚</div>
                    )}
                  </div>
                  <div className="p-5">
                    {course.category && <span className="text-xs font-medium text-primary">{course.category.name}</span>}
                    <h3 className="font-semibold text-foreground mt-1 mb-1 line-clamp-2 leading-snug">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">by {course.creator.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{course._count.enrollments} students</span>
                      <span className="font-bold text-foreground text-sm">
                        {course.price === 0 ? <span className="text-green-400">Free</span> : `$${(course.price / 100).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Learning Paths CTA ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="glass-card rounded-3xl p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-wider">Learning Paths</p>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Structured learning,<br />faster results.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Learning paths bundle multiple courses into a guided curriculum. Go from zero to expert with a clear roadmap.
              </p>
              <Link href="/paths" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all glow-blue">
                Explore Paths →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: '🎯', title: 'Curated order',      desc: 'Courses sequenced for maximum retention' },
                { icon: '💰', title: 'Bundle savings',     desc: 'Pay less than buying courses individually' },
                { icon: '🏆', title: 'Path completion',    desc: 'Certificate when you finish every course' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 glass-card rounded-xl p-4">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Teach CTA ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <div className="glass-card rounded-3xl p-14">
            <span className="text-5xl block mb-6">🎤</span>
            <h2 className="text-3xl font-bold text-foreground mb-4">Become an Instructor</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Share your expertise with thousands of real estate professionals. Create a course in minutes and start earning.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all glow-blue">
                Start Teaching Today
              </Link>
              <Link href="/courses" className="text-primary hover:underline font-medium">
                See how it works →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
