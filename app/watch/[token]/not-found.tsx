import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">動画が見つかりません</h1>
        <p className="text-gray-400 text-sm mb-6">
          このリンクは無効か、有効期限が切れています。<br />
          担当医師にお問い合わせください。
        </p>
      </div>
    </div>
  )
}
