import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
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

  const systemPrompt = `You are a curriculum designer for a real estate education platform. Given raw source material (a transcript, notes, or outline from a course creator), structure it into a course draft.

Guidelines:
- Break the material into logical modules, each with one or more lessons
- Each lesson's contentBody should be a clear, well-organized write-up of that portion of the material (use markdown formatting: headings, bullet points, bold for key terms) — rewrite for clarity, don't just copy-paste raw transcript text
- Write a concise, compelling course title and a 1-2 sentence description suitable for a course catalog
- Keep modules and lessons focused — prefer several short lessons over one giant lesson
- This is a DRAFT for the creator to review and edit before publishing — do your best, but it's okay if it needs refinement`

  try {
    const result = await anthropic.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Source material:\n\n${sourceText}` },
      ],
      output_config: {
        format: zodOutputFormat(draftSchema),
      },
    })

    return NextResponse.json({ draft: result.parsed_output })
  } catch (err) {
    console.error('AI course builder error:', err)
    return NextResponse.json({ error: 'Failed to generate course draft. Please try again.' }, { status: 500 })
  }
}
