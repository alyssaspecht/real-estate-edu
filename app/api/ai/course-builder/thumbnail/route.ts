import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const designSchema = z.object({
  emoji: z.string(),
  fromColor: z.string(),
  toColor: z.string(),
  label: z.string(),
})

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description } = await req.json()
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Missing title' }, { status: 400 })
  }

  try {
    const result = await anthropic.messages.parse({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You design simple cover thumbnails for online course cards. Given a course title and description, choose:
- "emoji": a single emoji that represents the course topic
- "fromColor" and "toColor": two hex colors (e.g. "#1e3a8a") that form an attractive gradient fitting the topic and a dark navy / electric-blue brand aesthetic
- "label": a short 2-4 word phrase (a tagline or key theme from the course) to display on the thumbnail`,
      messages: [
        { role: 'user', content: `Title: ${title}\nDescription: ${description ?? ''}` },
      ],
      output_config: {
        format: zodOutputFormat(designSchema),
      },
    })

    if (!result.parsed_output) {
      return NextResponse.json({ error: 'Failed to generate thumbnail.' }, { status: 500 })
    }

    const { emoji, fromColor, toColor, label } = result.parsed_output

    const titleFontSize = title.length > 60 ? 36 : title.length > 35 ? 44 : 56

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${fromColor}" />
      <stop offset="100%" stop-color="${toColor}" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)" />
  <text x="100" y="280" font-size="160" font-family="sans-serif">${escapeXml(emoji)}</text>
  <text x="100" y="420" font-size="${titleFontSize}" font-family="sans-serif" font-weight="700" fill="#ffffff" opacity="0.95">
    <tspan x="100" dy="0">${escapeXml(title.length > 70 ? title.slice(0, 67) + '…' : title)}</tspan>
  </text>
  <text x="100" y="480" font-size="32" font-family="sans-serif" fill="#ffffff" opacity="0.75">${escapeXml(label)}</text>
</svg>`

    const supabase = await createClient()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.svg`
    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, svg, { contentType: 'image/svg+xml', upsert: false })

    if (error) {
      console.error('Thumbnail upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Thumbnail generation error:', err)
    return NextResponse.json({ error: 'Failed to generate thumbnail.' }, { status: 500 })
  }
}
