'use client'

import { useRef, useState, useEffect } from 'react'

interface VideoPlayerProps {
  videoUrl: string
  shareId: string
  onComplete?: () => void
}

export default function VideoPlayer({ videoUrl, shareId, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [completed, setCompleted] = useState(false)
  const [reported, setReported] = useState(false)

  // 視聴開始時にログを記録
  useEffect(() => {
    fetch(`/api/watch/${shareId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: false, watchDurationSeconds: 0 }),
    }).catch(() => {})
  }, [shareId])

  async function handleEnded() {
    if (reported) return
    setCompleted(true)
    setReported(true)

    const duration = videoRef.current?.duration ?? 0

    try {
      await fetch(`/api/watch/${shareId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: true,
          watchDurationSeconds: Math.floor(duration),
        }),
      })
      onComplete?.()
    } catch {
      // silent fail
    }
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        playsInline
        className="w-full max-h-[70vh]"
        onEnded={handleEnded}
        controlsList="nodownload"
      />
      {completed && (
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            視聴完了しました
          </div>
        </div>
      )}
    </div>
  )
}
