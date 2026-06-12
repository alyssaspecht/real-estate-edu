import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center text-4xl mx-auto mb-6">
          😕
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Payment cancelled</h1>
        <p className="text-muted-foreground mb-8">No worries — nothing was charged. You can come back and enroll whenever you're ready.</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/courses"
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-center block"
          >
            Browse Courses
          </Link>
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
