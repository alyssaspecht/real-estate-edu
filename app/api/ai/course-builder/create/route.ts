import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const lessonSchema = z.object({
  title: z.string().min(1),
  contentBody: z.string(),
})

const moduleSchema = z.object({
  title: z.string().min(1),
  lessons: z.array(lessonSchema).min(1),
})

const draftSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  categoryId: z.string().optional().nullable(),
  modules: z.array(moduleSchema).min(1),
})

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = draftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid course draft' }, { status: 400 })
  }

  const { title, description, categoryId, modules } = parsed.data

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now()

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description,
      categoryId: categoryId || null,
      creatorId: currentUser.id,
      status: 'DRAFT',
      modules: {
        create: modules.map((mod, modIndex) => ({
          title: mod.title,
          position: modIndex + 1,
          lessons: {
            create: mod.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              type: 'TEXT' as const,
              contentBody: lesson.contentBody,
              position: lessonIndex + 1,
            })),
          },
        })),
      },
    },
  })

  return NextResponse.json({ course })
}
