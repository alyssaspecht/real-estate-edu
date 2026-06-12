import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, messages } = await req.json()
  if (!lessonId || !messages?.length) {
    return NextResponse.json({ error: 'lessonId and messages are required' }, { status: 400 })
  }

  // Load lesson + course, verify enrollment
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  })
  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const course = lesson.module.course

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  })
  // Allow creators/admins of the course to use the assistant too
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  const isCreatorOrAdmin = course.creatorId === user.id || dbUser?.role === 'ADMIN'

  if (!enrollment && !isCreatorOrAdmin) {
    return NextResponse.json({ error: 'Must be enrolled to use the AI assistant' }, { status: 403 })
  }

  // Build context from lesson content
  const lessonContext = [
    `Course: ${course.title}`,
    `Lesson: ${lesson.title}`,
    lesson.contentBody ? `\nLesson content:\n${lesson.contentBody}` : '',
  ].filter(Boolean).join('\n')

  const systemPrompt = `You are an AI course assistant for a real estate education platform. Your role is to help learners understand the course material and answer questions related to the lesson they're currently viewing.

${lessonContext}

Guidelines:
- Answer questions specifically about the lesson content above
- For real estate topics, be accurate and practical — learners are training for real-world careers
- Keep answers clear and concise; use bullet points or numbered lists when helpful
- If a question is outside the lesson scope, gently redirect to the relevant lesson topics
- Never give legal or financial advice — suggest consulting a licensed professional for those matters
- Be encouraging and supportive — these learners are building their careers`

  // Stream the response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 1024,
          thinking: { type: 'adaptive' },
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          stream: true,
        })

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        controller.close()
      } catch (err) {
        console.error('AI assistant error:', err)
        controller.enqueue(encoder.encode('\n\n[Error generating response. Please try again.]'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
