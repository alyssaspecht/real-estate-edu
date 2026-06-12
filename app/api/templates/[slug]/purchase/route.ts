import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// POST /api/templates/:slug/purchase
// For free templates: instantly grants access
// For paid templates: returns { requiresPayment: true, price } — Stripe flow coming soon
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to download templates' }, { status: 401 })

  const template = await prisma.template.findUnique({
    where: { slug },
    select: { id: true, price: true, status: true, title: true },
  })
  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Check if already owned
  const existing = await prisma.templatePurchase.findUnique({
    where: { userId_templateId: { userId: user.id, templateId: template.id } },
  })
  if (existing) return NextResponse.json({ ok: true, alreadyOwned: true })

  // Paid templates — Stripe not yet integrated
  if (template.price > 0) {
    return NextResponse.json({
      requiresPayment: true,
      price: template.price,
      message: 'Payment processing coming soon.',
    }, { status: 402 })
  }

  // Free — grant immediately
  const purchase = await prisma.templatePurchase.create({
    data: {
      userId: user.id,
      templateId: template.id,
      pricePaid: 0,
    },
  })

  return NextResponse.json({ ok: true, purchaseId: purchase.id })
}
