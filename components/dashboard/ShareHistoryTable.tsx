'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, isExpired } from '@/lib/utils'
import { CheckCircle2, Clock, Ban, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react'

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

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors min-h-0"
      title="リンクをコピー"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-600" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  )
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

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const sorted = [...localShares].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <>
      {/* モバイル: カード形式 */}
      <div className="md:hidden divide-y divide-gray-100">
        {sorted.map((share) => {
          const expired = isExpired(share.expires_at)
          const completed = share.watch_logs?.some((l) => l.is_completed)
          const watched = share.watch_logs?.length > 0
          const latestLog = share.watch_logs?.sort(
            (a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
          )[0]
          const isActive = !share.is_revoked && !expired
          const watchUrl = `${origin}/watch/${share.token}`

          return (
            <div key={share.id} className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 text-sm">
                  {share.patient_name ?? <span className="text-gray-400">患者名未設定</span>}
                </p>
                {share.is_revoked ? (
                  <Badge variant="danger" className="gap-1"><Ban className="w-3 h-3" />無効化済み</Badge>
                ) : expired ? (
                  <Badge variant="warning" className="gap-1"><AlertCircle className="w-3 h-3" />期限切れ</Badge>
                ) : completed ? (
                  <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" />視聴完了</Badge>
                ) : watched ? (
                  <Badge variant="info" className="gap-1"><Clock className="w-3 h-3" />視聴中</Badge>
                ) : (
                  <Badge variant="default">未視聴</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>発行日: {formatDate(share.created_at)}</span>
                <span className={expired || share.is_revoked ? 'text-gray-400 line-through' : ''}>
                  期限: {formatDate(share.expires_at)}
                </span>
                {latestLog && (
                  <span>
                    視聴: {new Date(latestLog.watched_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline min-h-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      リンクを開く
                    </a>
                    <CopyButton url={watchUrl} />
                    <button
                      onClick={() => handleRevoke(share.id)}
                      disabled={revokingId === share.id}
                      className="ml-auto text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 min-h-0"
                    >
                      {revokingId === share.id ? '処理中...' : '無効化'}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">リンク無効</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* デスクトップ: テーブル形式 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 font-medium">患者名</th>
              <th className="px-6 py-3 font-medium">発行日</th>
              <th className="px-6 py-3 font-medium">有効期限</th>
              <th className="px-6 py-3 font-medium">視聴状況</th>
              <th className="px-6 py-3 font-medium">視聴日時</th>
              <th className="px-6 py-3 font-medium">共有リンク</th>
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
              const watchUrl = `${origin}/watch/${share.token}`

              return (
                <tr key={share.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {share.patient_name ?? <span className="text-gray-400">未設定</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(share.created_at)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className={expired || share.is_revoked ? 'text-gray-400 line-through' : ''}>
                      {formatDate(share.expires_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {share.is_revoked ? (
                      <Badge variant="danger" className="gap-1"><Ban className="w-3 h-3" />無効化済み</Badge>
                    ) : expired ? (
                      <Badge variant="warning" className="gap-1"><AlertCircle className="w-3 h-3" />期限切れ</Badge>
                    ) : completed ? (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" />視聴完了</Badge>
                    ) : watched ? (
                      <Badge variant="info" className="gap-1"><Clock className="w-3 h-3" />視聴中</Badge>
                    ) : (
                      <Badge variant="default">未視聴</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {latestLog ? (
                      new Date(latestLog.watched_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <a
                        href={watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs truncate max-w-[160px] hover:underline min-h-0 ${isActive ? 'text-primary' : 'text-gray-300 pointer-events-none'}`}
                        title={watchUrl}
                      >
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          /watch/{share.token.slice(0, 8)}…
                        </span>
                      </a>
                      {isActive && <CopyButton url={watchUrl} />}
                    </div>
                  </td>
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
    </>
  )
}
