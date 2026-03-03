'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { X, Copy, Check, QrCode, Link2 } from 'lucide-react'

interface ShareModalProps {
  videoId: string
  videoTitle: string
  onClose: () => void
}

interface ShareData {
  shareUrl: string
  qrCodeDataUrl: string
  patientName: string | null
  expiresAt: string
}

export default function ShareModal({ videoId, videoTitle, onClose }: ShareModalProps) {
  const [patientName, setPatientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleShare() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/videos/${videoId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: patientName || null }),
      })

      if (!res.ok) {
        throw new Error('共有リンクの生成に失敗しました')
      }

      const data = await res.json()
      setShareData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!shareData) return
    await navigator.clipboard.writeText(shareData.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">患者へ共有</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors min-h-0 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            「{videoTitle}」の共有リンクを生成します
          </p>

          {!shareData ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  患者名（任意）
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                  placeholder="田中 一郎"
                />
                <p className="text-xs text-gray-400 mt-1">入力するとダッシュボードで管理しやすくなります</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  キャンセル
                </Button>
                <Button className="flex-1" onClick={handleShare} loading={loading}>
                  <Link2 className="w-4 h-4 mr-1.5" />
                  リンクを生成
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <img
                    src={shareData.qrCodeDataUrl}
                    alt="QRコード"
                    className="w-40 h-40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 mb-1">
                <QrCode className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500">QRコードを患者に見せるか、リンクを共有してください</p>
              </div>

              {/* URL */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate min-h-[44px] flex items-center">
                  {shareData.shareUrl}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                有効期限: {new Date(shareData.expiresAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <Button className="w-full" onClick={onClose}>
                閉じる
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
