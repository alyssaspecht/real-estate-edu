import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getUser'

// GET /api/templates?category=slug&search=text&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 24

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
        category: true,
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.template.count({ where }),
    prisma.templateCategory.findMany({ orderBy: { position: 'asc' } }),
  ])

  return NextResponse.json({ templates, total, categories, page, pages: Math.ceil(total / limit) })
}

// POST /api/templates — creator or admin creates a template
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, longDescription, price, categoryId, fileUrl, previewImageUrl, fileType, fileSize, isPlatformItem } = body

  if (!title?.trim() || !categoryId) {
    return NextResponse.json({ error: 'title and categoryId are required' }, { status: 400 })
  }

  // Only admins can mark as platform item
  const platformItem = user.role === 'ADMIN' ? (isPlatformItem ?? false) : false

  const slug = title.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) + '-' + Math.random().toString(36).slice(2, 7)

  const template = await prisma.template.create({
    data: {
      creatorId: platformItem ? null : user.id,
      categoryId,
      title: title.trim(),
      slug,
      description: description?.trim() ?? null,
      longDescription: longDescription?.trim() ?? null,
      price: Math.max(0, Math.round(price ?? 0)),
      fileUrl: fileUrl ?? null,
      previewImageUrl: previewImageUrl ?? null,
      fileType: fileType ?? null,
      fileSize: fileSize ?? null,
      isPlatformItem: platformItem,
      status: 'DRAFT',
    },
    include: { category: true },
  })

  return NextResponse.json(template, { status: 201 })
}
