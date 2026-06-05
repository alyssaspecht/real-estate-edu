import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getUser'
import { mux } from '@/lib/mux'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { uploadId, lessonId } = await request.json()

  // Get the upload to find the asset ID
  const upload = await mux.video.uploads.retrieve(uploadId)
  const assetId = upload.asset_id

  if (!assetId) {
    return NextResponse.json({ error: 'Asset not ready yet' }, { status: 202 })
  }

  // Get asset details including playback ID and duration
  const asset = await mux.video.assets.retrieve(assetId)
  const playbackId = asset.playback_ids?.[0]?.id
  const duration = asset.duration ? Math.round(asset.duration) : null

  // Save to lesson
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      videoAssetId: assetId,
      videoPlaybackId: playbackId,
      durationSeconds: duration,
    },
  })

  return NextResponse.json({ assetId, playbackId, duration })
}
