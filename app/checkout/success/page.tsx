import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; type?: string; slug?: string }>
}) {
  const { session_id, type, slug } = await searchParams

  if (!session_id) redirect('/')

  // Verify with Stripe
  let verified = false
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    verified = session.payment_status === 'paid'
  } catch {
    redirect('/')
  }

  if (!verified) redirect('/')

  // Look up the item for the CTA
  let title = ''
  let ctaLabel = ''
  let ctaHref = '/'
  let emoji = '🎉'

  if (type === 'course' && slug) {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        title: true,
        modules: {
          orderBy: { position: 'asc' },
          take: 1,
          include: { lessons: { orderBy: { position: 'asc' }, take: 1 } },
        },
      },
    })
    if (course) {
      title = course.title
      const firstLesson = course.modules[0]?.lessons[0]
      ctaHref = firstLesson ? `/courses/${slug}/lessons/${firstLesson.id}` : `/courses/${slug}`
      ctaLabel = 'Start Learning →'
      emoji = '🎓'
    }
  } else if (type === 'template' && slug) {
    const template = await prisma.template.findUnique({
      where: { slug },
      select: { title: true },
    })
    if (template) {
      title = template.title
      ctaHref = `/api/templates/${slug}/download`
      ctaLabel = '⬇️ Download Now'
      emoji = '📄'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-4xl mx-auto mb-6">
          {emoji}
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">You're all set!</h1>

        {title && (
          <p className="text-muted-foreground mb-2 text-lg">
            <span className="text-foreground font-medium">{title}</span> is now yours.
          </p>
        )}

        <p className="text-muted-foreground text-sm mb-8">
          A confirmation has been sent to your email. You can access this from your dashboard anytime.
        </p>

        <div className="flex flex-col gap-3">
          {ctaLabel && (
            <a
              href={ctaHref}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors glow-blue text-center block"
            >
              {ctaLabel}
            </a>
          )}
          <Link
            href="/dashboard"
            className="w-full bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-secondary transition-colors text-center block text-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
