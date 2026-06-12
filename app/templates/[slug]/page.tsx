import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateDetail } from '@/components/templates/TemplateDetail'

export const dynamic = 'force-dynamic'

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const template = await prisma.template.findUnique({
    where: { slug },
    include: {
      category: true,
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { purchases: true } },
    },
  })

  if (!template || template.status !== 'PUBLISHED') notFound()

  // Check ownership
  let isOwned = false
  if (user) {
    const purchase = await prisma.templatePurchase.findUnique({
      where: { userId_templateId: { userId: user.id, templateId: template.id } },
    })
    isOwned = !!purchase

    // Creator/admin always "owns" their templates
    if (!isOwned && (template.creatorId === user.id)) isOwned = true
    if (!isOwned) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
      if (dbUser?.role === 'ADMIN') isOwned = true
    }
  }

  return (
    <TemplateDetail
      template={template}
      isOwned={isOwned}
      userId={user?.id ?? null}
    />
  )
}
