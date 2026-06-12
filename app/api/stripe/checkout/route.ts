import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// POST /api/stripe/checkout
// Body: { type: 'course', courseId, couponCode? }
//     | { type: 'template', templateId }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 })

  const body = await req.json()
  const { type } = body

  if (type === 'course') {
    return handleCourseCheckout(user.id, body)
  } else if (type === 'template') {
    return handleTemplateCheckout(user.id, body)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

async function handleCourseCheckout(userId: string, body: { courseId: string; couponCode?: string }) {
  const { courseId, couponCode } = body

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, slug: true, price: true, thumbnail: true, status: true },
  })
  if (!course || course.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
  if (course.price === 0) {
    return NextResponse.json({ error: 'Course is free — use the enroll endpoint directly' }, { status: 400 })
  }

  // Check not already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })

  // Apply coupon if provided
  let finalPrice = course.price
  let couponId: string | null = null

  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        active: true,
        AND: [
          { OR: [{ courseId }, { courseId: null }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ],
      },
    })
    if (coupon) {
      couponId = coupon.id
      if (coupon.discountType === 'PERCENT') {
        finalPrice = Math.round(course.price * (1 - coupon.discountValue / 100))
      } else {
        finalPrice = Math.max(0, course.price - coupon.discountValue)
      }
    }
  }

  // If coupon makes it free, redirect to free enroll
  if (finalPrice === 0) {
    return NextResponse.json({ free: true, courseSlug: course.slug })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: finalPrice,
          product_data: {
            name: course.title,
            description: `Full course access — RE Academy`,
            ...(course.thumbnail ? { images: [course.thumbnail] } : {}),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'course',
      courseId: course.id,
      userId,
      couponId: couponId ?? '',
      pricePaid: String(finalPrice),
    },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=course&slug=${course.slug}`,
    cancel_url: `${siteUrl}/courses/${course.slug}`,
  })

  return NextResponse.json({ url: session.url })
}

async function handleTemplateCheckout(userId: string, body: { templateId: string }) {
  const { templateId } = body

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, title: true, slug: true, price: true, previewImageUrl: true, status: true },
  })
  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
  if (template.price === 0) {
    return NextResponse.json({ error: 'Template is free — use the purchase endpoint directly' }, { status: 400 })
  }

  // Check not already purchased
  const existing = await prisma.templatePurchase.findUnique({
    where: { userId_templateId: { userId, templateId } },
  })
  if (existing) return NextResponse.json({ error: 'Already purchased' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: template.price,
          product_data: {
            name: template.title,
            description: 'RE Academy — Tools & Templates',
            ...(template.previewImageUrl ? { images: [template.previewImageUrl] } : {}),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'template',
      templateId: template.id,
      userId,
      pricePaid: String(template.price),
    },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=template&slug=${template.slug}`,
    cancel_url: `${siteUrl}/templates/${template.slug}`,
  })

  return NextResponse.json({ url: session.url })
}
