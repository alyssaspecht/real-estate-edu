'use client'

import { useState, useRef } from 'react'

type Props = {
  lessonId: string
  currentPlaybackId?: string | null
  onUploadComplete: (playbackId: string) => void
}

export function VideoUploader({ lessonId, currentPlaybackId, onUploadComplete }: Props) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setProgress(0)
    setError('')

    try {
      // Step 1: Get upload URL from Mux
      const urlRes = await fetch('/api/mux/upload-url', { method: 'POST' })
      const { uploadId, uploadUrl } = await urlRes.json()

      // Step 2: Upload directly to Mux using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error('Upload failed'))
        })
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.open('PUT', uploadUrl)
        xhr.send(file)
      })

      // Step 3: Poll for asset to be ready
      setStatus('processing')
      let playbackId = null
      let attempts = 0

      while (!playbackId && attempts < 30) {
        await new Promise(r => setTimeout(r, 3000))
        const assetRes = await fetch('/api/mux/asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, lessonId }),
        })

        if (assetRes.status === 202) {
          attempts++
          continue
        }

        const data = await assetRes.json()
        if (data.playbackId) {
          playbackId = data.playbackId
        } else {
          attempts++
        }
      }

      if (playbackId) {
        setStatus('done')
        onUploadComplete(playbackId)
      } else {
        throw new Error('Video processing timed out. Please refresh.')
      }

    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  if (currentPlaybackId && status === 'idle') {
    return (
      <div className="space-y-3">
        <div className="rounded-lg overflow-hidden aspect-video bg-black">
          <mux-player
            stream-type="on-demand"
            playback-id={currentPlaybackId}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-blue-600 hover:underline"
        >
          Replace video
        </button>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {status === 'idle' && (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <span className="text-3xl mb-2">🎬</span>
          <span className="text-sm font-medium text-gray-700">Click to upload video</span>
          <span className="text-xs text-gray-400 mt-1">MP4, MOV, AVI supported</span>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}

      {status === 'uploading' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">Uploading video...</span>
            <span className="text-blue-600 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="animate-spin text-xl">⚙️</div>
          <div>
            <p className="text-sm font-medium text-yellow-800">Processing video...</p>
            <p className="text-xs text-yellow-600">This usually takes 1-2 minutes</p>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-medium text-green-800">Video ready!</p>
            <p className="text-xs text-green-600">Learners can now watch this lesson</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <span className="text-xl">❌</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => { setStatus('idle'); setError('') }}
            className="text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
