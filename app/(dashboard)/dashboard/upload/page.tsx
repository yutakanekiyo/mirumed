import UploadForm from '@/components/dashboard/UploadForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function UploadPage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 min-h-0"
        >
          <ArrowLeft className="w-4 h-4" />
          動画一覧へ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">動画アップロード</h1>
        <p className="text-gray-500 mt-1 text-sm">患者説明用の動画をアップロードします</p>
      </div>

      <div className="max-w-2xl">
        <UploadForm />
      </div>
    </div>
  )
}
