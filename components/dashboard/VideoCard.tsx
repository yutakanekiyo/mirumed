'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/dashboard/ShareModal'
import { formatDate, formatDuration, isExpired } from '@/lib/utils'
import { Share2, Trash2, Clock, CheckCircle2, Eye, ChevronRight } from 'lucide-react'

interface WatchLog {
  id: string
  is_completed: boolean
  watched_at: string
}

interface VideoShare {
  id: string
  token: string
  patient_name: string | null
  expires_at: string
  is_revoked: boolean
  created_at: string
  watch_logs: WatchLog[]
}

interface Video {
  id: string
  title: string
  description: string | null
  disease_category: string | null
  duration_seconds: number | null
  created_at: string
  video_shares: VideoShare[]
}

interface VideoCardProps {
  video: Video
}

export default function VideoCard({ video }: VideoCardProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const activeShares = video.video_shares?.filter(
    (s) => !s.is_revoked && !isExpired(s.expires_at)
  ) ?? []

  const completedWatches = video.video_shares?.flatMap((s) =>
    s.watch_logs?.filter((l) => l.is_completed) ?? []
  ) ?? []

  const hasBeenWatched = completedWatches.length > 0

  async function handleDelete() {
    if (!confirm('この動画を削除しますか？この操作は取り消せません。')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardBody className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
              {video.title}
            </h3>
            {hasBeenWatched && (
              <Badge variant="success" className="flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                既読
              </Badge>
            )}
          </div>

          {/* Category */}
          {video.disease_category && (
            <Badge variant="info" className="mb-3">
              {video.disease_category}
            </Badge>
          )}

          {/* Description */}
          {video.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{video.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {video.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(video.duration_seconds)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {completedWatches.length}回視聴完了
            </span>
            <span>{formatDate(video.created_at)}</span>
          </div>

          {/* Active shares count */}
          {activeShares.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                有効な共有リンク: <span className="font-medium text-gray-700">{activeShares.length}件</span>
              </p>
            </div>
          )}
        </CardBody>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Link href={`/dashboard/videos/${video.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-gray-600">
              <ChevronRight className="w-4 h-4 mr-1.5" />
              詳細・履歴
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            共有
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {showShareModal && (
        <ShareModal
          videoId={video.id}
          videoTitle={video.title}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  )
}
