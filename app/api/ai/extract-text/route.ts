import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported for upload. For other file types, paste the text directly.' }, { status: 400 })
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'File is too large (max 25MB).' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    const result = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            {
              type: 'text',
              text: 'Extract all the text content from this document, preserving its structure (headings, lists, etc.) as plain text or simple markdown. Output only the extracted content — no commentary.',
            },
          ],
        },
      ],
    })

    const text = result.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Extract text error:', err)
    return NextResponse.json({ error: 'Failed to extract text from file. Please try again or paste the text directly.' }, { status: 500 })
  }
}
