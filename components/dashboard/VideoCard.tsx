'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/dashboard/ShareModal'
import { formatDate, formatDuration, isExpired } from '@/lib/utils'
import { Share2, Trash2, Clock, Eye, ChevronRight, Users } from 'lucide-react'

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

  // 発行済み（取り消しなし）の全共有を分母にする
  const sentShares = video.video_shares?.filter((s) => !s.is_revoked) ?? []
  const completedShares = sentShares.filter((s) =>
    s.watch_logs?.some((l) => l.is_completed)
  )
  const readRate = sentShares.length > 0
    ? Math.round((completedShares.length / sentShares.length) * 100)
    : 0

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
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
              {video.title}
            </h3>
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
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            {video.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(video.duration_seconds)}
              </span>
            )}
            <span>{formatDate(video.created_at)}</span>
          </div>

          {/* Stats */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            {/* 共有中の患者数 */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Users className="w-4 h-4" />
                共有中の患者数
              </span>
              <span className="font-semibold text-gray-900">
                {activeShares.length}
                <span className="font-normal text-gray-400 text-xs ml-0.5">人</span>
              </span>
            </div>

            {/* 既読率 */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-500">既読率</span>
                <span className="font-semibold text-gray-900">
                  {sentShares.length > 0 ? (
                    <>
                      {readRate}
                      <span className="font-normal text-gray-400 text-xs ml-0.5">%</span>
                      <span className="font-normal text-gray-400 text-xs ml-1.5">
                        ({completedShares.length}/{sentShares.length}人)
                      </span>
                    </>
                  ) : (
                    <span className="font-normal text-gray-400 text-xs">未共有</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    readRate === 100
                      ? 'bg-green-500'
                      : readRate > 0
                      ? 'bg-primary'
                      : 'bg-gray-200'
                  }`}
                  style={{ width: `${readRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardBody>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-2">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            患者に共有する
          </Button>
          <div className="flex items-stretch gap-2">
            <Link href={`/dashboard/videos/${video.id}`} className="flex-1 flex">
              <Button variant="ghost" size="sm" className="w-full text-gray-600">
                <ChevronRight className="w-4 h-4 mr-1.5" />
                詳細・履歴
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={isDeleting}
              className="text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
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
