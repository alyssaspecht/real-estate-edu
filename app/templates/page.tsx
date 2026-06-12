import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TemplateBrowser } from '@/components/templates/TemplateBrowser'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}) {
  const sp = await searchParams
  const category = sp.category ?? null
  const search = sp.search ?? null
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 24

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's purchased template IDs
  let ownedTemplateIds: string[] = []
  if (user) {
    const purchases = await prisma.templatePurchase.findMany({
      where: { userId: user.id },
      select: { templateId: true },
    })
    ownedTemplateIds = purchases.map(p => p.templateId)
  }

  const where: Record<string, unknown> = { status: 'PUBLISHED' }
  if (category) where.category = { slug: category }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [templates, total, categories] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy: [{ isPlatformItem: 'desc' }, { downloadCount: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.template.count({ where }),
    prisma.templateCategory.findMany({ orderBy: { position: 'asc' } }),
  ])

  return (
    <TemplateBrowser
      templates={templates}
      categories={categories}
      total={total}
      page={page}
      pages={Math.ceil(total / limit)}
      activeCategory={category}
      activeSearch={search}
      ownedTemplateIds={ownedTemplateIds}
      userId={user?.id ?? null}
    />
  )
}
