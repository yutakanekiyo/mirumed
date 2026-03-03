import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/watch/VideoPlayer'
import { Video } from 'lucide-react'

interface WatchPageProps {
  params: Promise<{ token: string }>
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { token } = await params
  const supabase = await createClient()

  // トークン検証
  const { data: share } = await supabase
    .from('video_shares')
    .select(`
      id,
      patient_name,
      expires_at,
      is_revoked,
      videos (
        title,
        description,
        storage_path,
        profiles (
          full_name,
          clinic_name
        )
      )
    `)
    .eq('token', token)
    .single()

  if (!share || share.is_revoked || new Date(share.expires_at) < new Date()) {
    notFound()
  }

  const video = share.videos as unknown as {
    title: string
    description: string | null
    storage_path: string
    profiles: { full_name: string; clinic_name: string } | null
  } | null

  if (!video) notFound()

  // 署名付きURL生成（1時間有効）
  const { data: signedUrlData } = await supabase.storage
    .from('videos')
    .createSignedUrl(video.storage_path, 3600)

  if (!signedUrlData?.signedUrl) notFound()

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
            <p className="text-xs text-gray-400">{video.profiles?.clinic_name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {share.patient_name && (
          <p className="text-gray-400 text-sm mb-4">{share.patient_name} 様へ</p>
        )}

        <h1 className="text-xl font-bold text-white mb-2">{video.title}</h1>
        {video.description && (
          <p className="text-gray-400 text-sm mb-4">{video.description}</p>
        )}

        <p className="text-xs text-gray-500 mb-4">
          {video.profiles?.full_name} より
        </p>

        <VideoPlayer
          videoUrl={signedUrlData.signedUrl}
          shareId={share.id}
        />

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
