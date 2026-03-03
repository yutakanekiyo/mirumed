import { notFound } from 'next/navigation'
import VideoPlayer from '@/components/watch/VideoPlayer'
import { Video } from 'lucide-react'

interface WatchPageProps {
  params: Promise<{ token: string }>
}

interface WatchData {
  shareId: string
  videoUrl: string
  title: string
  description: string | null
  patientName: string | null
  clinicName: string
  doctorName: string
}

async function getWatchData(token: string): Promise<WatchData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/watch/${token}`, {
      cache: 'no-store',
    })

    if (!res.ok) return null

    return res.json()
  } catch {
    return null
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { token } = await params
  const data = await getWatchData(token)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">mirumed</p>
            <p className="text-xs text-gray-400">{data.clinicName}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Patient greeting */}
        {data.patientName && (
          <p className="text-gray-400 text-sm mb-4">
            {data.patientName} 様へ
          </p>
        )}

        {/* Video title */}
        <h1 className="text-xl font-bold text-white mb-2">{data.title}</h1>
        {data.description && (
          <p className="text-gray-400 text-sm mb-4">{data.description}</p>
        )}

        <p className="text-xs text-gray-500 mb-4">
          {data.doctorName} より
        </p>

        {/* Video player */}
        <VideoPlayer
          videoUrl={data.videoUrl}
          shareId={data.shareId}
        />

        {/* Note */}
        <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-400 leading-relaxed">
            この動画はあなた専用の共有リンクで配信されています。
            視聴状況は担当医師に通知されます。
            ご不明な点は担当医師にお尋ねください。
          </p>
        </div>
      </main>
    </div>
  )
}
