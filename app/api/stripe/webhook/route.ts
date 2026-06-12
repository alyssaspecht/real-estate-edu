import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Stripe requires raw body for signature verification
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await fulfillOrder(session)
  }

  return NextResponse.json({ received: true })
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const { type, userId, courseId, templateId, couponId, pricePaid } = session.metadata ?? {}

  if (!userId) {
    console.error('Webhook: missing userId in metadata', session.id)
    return
  }

  if (type === 'course' && courseId) {
    // Idempotent — skip if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) return

    // Create enrollment
    await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        pricePaid: parseInt(pricePaid ?? '0'),
      },
    })

    // Increment coupon usage
    if (couponId) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {}) // non-critical
    }

    // Create an Order record for bookkeeping
    await prisma.order.create({
      data: {
        userId,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        totalCents: parseInt(pricePaid ?? '0'),
        status: 'COMPLETED',
        orderItems: {
          create: {
            courseId,
            priceCents: parseInt(pricePaid ?? '0'),
          },
        },
      },
    })

    console.log(`✅ Enrolled user ${userId} in course ${courseId}`)
  }

  if (type === 'template' && templateId) {
    // Idempotent
    const existing = await prisma.templatePurchase.findUnique({
      where: { userId_templateId: { userId, templateId } },
    })
    if (existing) return

    await prisma.templatePurchase.create({
      data: {
        userId,
        templateId,
        pricePaid: parseInt(pricePaid ?? '0'),
      },
    })

    console.log(`✅ Granted template ${templateId} to user ${userId}`)
  }
}
