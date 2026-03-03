'use client'

import { useRef, useState, useEffect } from 'react'

interface VideoPlayerProps {
  videoUrl: string
  shareId: string
  onComplete?: () => void
}

export default function VideoPlayer({ videoUrl, shareId, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [reported, setReported] = useState(false)

  useEffect(() => {
    fetch('/api/watch/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, isCompleted: false, watchDurationSeconds: 0 }),
    }).catch(() => {})
  }, [shareId])

  function handlePlayClick() {
    const video = videoRef.current
    if (!video) return
    setStarted(true)
    video.play()
  }

  function handlePause() {
    setPlaying(false)
  }

  function handlePlay() {
    setPlaying(true)
  }

  async function handleEnded() {
    setPlaying(false)
    if (reported) return
    setCompleted(true)
    setReported(true)

    const duration = videoRef.current?.duration ?? 0
    try {
      await fetch('/api/watch/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareId,
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
    <div className="space-y-3">
      {/* プレーヤー本体 */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-md">
        <video
          ref={videoRef}
          src={videoUrl}
          controls={started}
          playsInline
          className="w-full max-h-[60vh] block"
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          controlsList="nodownload"
        />

        {/* 再生前オーバーレイ */}
        {!started && (
          <button
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors group min-h-0"
            aria-label="再生する"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-150">
              <svg
                className="w-9 h-9 text-primary ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* 視聴完了バナー */}
      {completed && (
        <div className="flex items-center justify-center gap-2.5 py-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 font-medium text-sm">視聴完了しました</p>
        </div>
      )}
    </div>
  )
}
