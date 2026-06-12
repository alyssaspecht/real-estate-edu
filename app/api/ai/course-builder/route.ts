import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const lessonSchema = z.object({
  title: z.string(),
  contentBody: z.string(),
})

const moduleSchema = z.object({
  title: z.string(),
  lessons: z.array(lessonSchema).min(1),
})

const draftSchema = z.object({
  title: z.string(),
  description: z.string(),
  categoryId: z.string().nullable(),
  modules: z.array(moduleSchema).min(1),
})

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sourceText } = await req.json()
  if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length < 50) {
    return NextResponse.json({ error: 'Please provide at least a few sentences of source material.' }, { status: 400 })
  }

  const categories = await prisma.category.findMany({ select: { id: true, name: true } })
  const categoryList = categories.map((c) => `- ${c.id}: ${c.name}`).join('\n')

  const systemPrompt = `You are an instructional designer building a course for a real estate education platform. Given raw source material (a transcript, notes, outline, or document from a course creator), structure it into a well-designed course draft using sound instructional design principles.

Guidelines:
- Break the material into logical modules that build on each other, each with one or more focused lessons
- For each lesson, write a contentBody in markdown that includes:
  - A brief intro framing what the lesson covers and why it matters
  - The core content, rewritten for clarity (don't just copy-paste raw transcript text) using headings, bullet points, and bold for key terms
  - A "**Key Takeaways**" section summarizing the 2-4 most important points
  - A short "**Knowledge Check**" with 1-3 reflection or self-check questions to reinforce learning
- Write a concise, compelling course title and a 1-2 sentence description suitable for a course catalog
- Keep modules and lessons focused — prefer several short lessons over one giant lesson
- Choose the single best-fitting categoryId from this list, or null if none fit well:
${categoryList}
- This is a DRAFT for the creator to review and edit before publishing — do your best, but it's okay if it needs refinement`

  try {
    const result = await anthropic.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Source material:\n\n${sourceText}` },
      ],
      output_config: {
        format: zodOutputFormat(draftSchema),
      },
    })

    if (!result.parsed_output) {
      return NextResponse.json({ error: 'Failed to generate course draft. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ draft: result.parsed_output })
  } catch (err) {
    console.error('AI course builder error:', err)
    return NextResponse.json({ error: 'Failed to generate course draft. Please try again.' }, { status: 500 })
  }
}
