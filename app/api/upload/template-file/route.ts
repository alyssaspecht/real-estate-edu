import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getUser'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/zip',
  'image/png',
  'image/jpeg',
]

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 50MB' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed. Use PDF, DOCX, PPTX, XLSX, or ZIP.' }, { status: 400 })
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const fileName = `templates/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('thumbnails') // reusing existing bucket
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(data.path)

  // Detect file type label
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/zip': 'ZIP',
  }

  return NextResponse.json({
    url: publicUrl,
    fileType: typeMap[file.type] ?? ext?.toUpperCase() ?? 'FILE',
    fileSize: file.size,
    fileName: file.name,
  })
}
