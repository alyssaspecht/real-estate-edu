import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { mux } from '@/lib/mux'

export async function POST() {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create a direct upload URL from Mux
  const upload = await mux.video.uploads.create({
    cors_origin: 'http://localhost:3000',
    new_asset_settings: {
      playback_policy: ['public'],
      encoding_tier: 'baseline',
    },
  })

  return NextResponse.json({
    uploadId: upload.id,
    uploadUrl: upload.url,
  })
}
