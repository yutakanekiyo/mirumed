'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { Upload, Film, X } from 'lucide-react'

const DISEASE_CATEGORIES = [
  '内科', '外科', '整形外科', '眼科', '耳鼻咽喉科', '皮膚科',
  '泌尿器科', '婦人科', '小児科', '精神科', '歯科', 'その他',
]

export default function UploadForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    diseaseCategory: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('video/')) {
      setError('動画ファイルを選択してください')
      return
    }

    if (selected.size > 500 * 1024 * 1024) {
      setError('ファイルサイズは500MB以下にしてください')
      return
    }

    setFile(selected)
    setError(null)
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('動画ファイルを選択してください')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      // Supabase Storageにアップロード
      const fileExt = file.name.split('.').pop()
      const storagePath = `${user.id}/${Date.now()}.${fileExt}`

      setUploadProgress(20)

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw new Error('アップロードに失敗しました: ' + uploadError.message)

      setUploadProgress(70)

      // メタデータをDBに保存
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          diseaseCategory: formData.diseaseCategory || null,
          storagePath,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'メタデータの保存に失敗しました')
      }

      setUploadProgress(100)

      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File upload area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              動画ファイル <span className="text-red-500">*</span>
            </label>

            {file ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-gray-400 hover:text-gray-600 min-h-0 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-primary-300 hover:bg-primary-50 transition-colors min-h-0"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">クリックして動画を選択</p>
                <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI など（最大500MB）</p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
              placeholder="例: 糖尿病の食事療法について"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="diseaseCategory" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              id="diseaseCategory"
              name="diseaseCategory"
              value={formData.diseaseCategory}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary bg-white"
            >
              <option value="">選択してください</option>
              {DISEASE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary resize-none min-h-0"
              placeholder="動画の内容について補足説明を入力してください"
            />
          </div>

          {/* Progress bar */}
          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
              disabled={uploading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={uploading}
              disabled={!file || !formData.title}
            >
              <Upload className="w-4 h-4 mr-2" />
              アップロード
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
