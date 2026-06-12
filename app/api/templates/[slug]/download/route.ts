import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { onTemplateDownload } from '@/lib/gamification'

// GET /api/templates/:slug/download — verify ownership, redirect to file or return link
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const template = await prisma.template.findUnique({
    where: { slug },
    select: { id: true, fileUrl: true, templateLinkUrl: true, deliveryType: true, title: true, status: true, creatorId: true },
  })
  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check access
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  const isOwnerOrAdmin = template.creatorId === user.id || dbUser?.role === 'ADMIN'

  if (!isOwnerOrAdmin) {
    const purchase = await prisma.templatePurchase.findUnique({
      where: { userId_templateId: { userId: user.id, templateId: template.id } },
    })
    if (!purchase) return NextResponse.json({ error: 'Purchase required' }, { status: 403 })

    await prisma.templatePurchase.update({
      where: { userId_templateId: { userId: user.id, templateId: template.id } },
      data: { downloadedAt: new Date() },
    })
  }

  // Increment download count + award XP
  await Promise.all([
    prisma.template.update({ where: { id: template.id }, data: { downloadCount: { increment: 1 } } }),
    onTemplateDownload(user.id),
  ])

  // Link delivery — return the URL as JSON so the client can open it
  if (template.deliveryType === 'LINK') {
    if (!template.templateLinkUrl) {
      return NextResponse.json({ error: 'Template link not available yet' }, { status: 404 })
    }
    return NextResponse.json({ type: 'link', url: template.templateLinkUrl })
  }

  // File delivery — redirect to the file URL
  if (!template.fileUrl) {
    return NextResponse.json({ error: 'No file available' }, { status: 404 })
  }
  return NextResponse.redirect(template.fileUrl)
}
