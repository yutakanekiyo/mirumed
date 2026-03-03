'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, isExpired } from '@/lib/utils'
import { CheckCircle2, Clock, Ban, AlertCircle } from 'lucide-react'

interface WatchLog {
  id: string
  watched_at: string
  is_completed: boolean
  watch_duration_seconds: number
}

interface Share {
  id: string
  token: string
  patient_name: string | null
  expires_at: string
  is_revoked: boolean
  created_at: string
  watch_logs: WatchLog[]
}

interface ShareHistoryTableProps {
  shares: Share[]
}

export default function ShareHistoryTable({ shares }: ShareHistoryTableProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [localShares, setLocalShares] = useState(shares)

  async function handleRevoke(shareId: string) {
    if (!confirm('この共有リンクを無効にしますか？患者はアクセスできなくなります。')) return
    setRevokingId(shareId)
    try {
      const res = await fetch(`/api/shares/${shareId}/revoke`, { method: 'POST' })
      if (res.ok) {
        setLocalShares((prev) =>
          prev.map((s) => (s.id === shareId ? { ...s, is_revoked: true } : s))
        )
      }
    } finally {
      setRevokingId(null)
    }
  }

  if (localShares.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-400 text-sm">
        まだ共有リンクが発行されていません
      </div>
    )
  }

  // 新しい順に並べる
  const sorted = [...localShares].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-6 py-3 font-medium">患者名</th>
            <th className="px-6 py-3 font-medium">発行日</th>
            <th className="px-6 py-3 font-medium">有効期限</th>
            <th className="px-6 py-3 font-medium">視聴状況</th>
            <th className="px-6 py-3 font-medium">視聴日時</th>
            <th className="px-6 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((share) => {
            const expired = isExpired(share.expires_at)
            const completed = share.watch_logs?.some((l) => l.is_completed)
            const watched = share.watch_logs?.length > 0
            const latestLog = share.watch_logs?.sort(
              (a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
            )[0]
            const isActive = !share.is_revoked && !expired

            return (
              <tr key={share.id} className="hover:bg-gray-50 transition-colors">
                {/* 患者名 */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  {share.patient_name ?? (
                    <span className="text-gray-400">未設定</span>
                  )}
                </td>

                {/* 発行日 */}
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(share.created_at)}
                </td>

                {/* 有効期限 */}
                <td className="px-6 py-4 text-gray-600">
                  <span className={expired || share.is_revoked ? 'text-gray-400 line-through' : ''}>
                    {formatDate(share.expires_at)}
                  </span>
                </td>

                {/* 視聴状況 */}
                <td className="px-6 py-4">
                  {share.is_revoked ? (
                    <Badge variant="danger" className="gap-1">
                      <Ban className="w-3 h-3" />
                      無効化済み
                    </Badge>
                  ) : expired ? (
                    <Badge variant="warning" className="gap-1">
                      <AlertCircle className="w-3 h-3" />
                      期限切れ
                    </Badge>
                  ) : completed ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      視聴完了
                    </Badge>
                  ) : watched ? (
                    <Badge variant="info" className="gap-1">
                      <Clock className="w-3 h-3" />
                      視聴中
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1">
                      未視聴
                    </Badge>
                  )}
                </td>

                {/* 視聴日時 */}
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {latestLog ? (
                    <span>
                      {new Date(latestLog.watched_at).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* アクション */}
                <td className="px-6 py-4">
                  {isActive && (
                    <button
                      onClick={() => handleRevoke(share.id)}
                      disabled={revokingId === share.id}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 min-h-0"
                    >
                      {revokingId === share.id ? '処理中...' : '無効化'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
