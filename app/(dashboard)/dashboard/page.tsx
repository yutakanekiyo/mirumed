import { createClient } from '@/lib/supabase/server'
import VideoCard from '@/components/dashboard/VideoCard'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Upload, VideoOff } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: videos } = await supabase
    .from('videos')
    .select(`
      *,
      video_shares (
        id,
        token,
        patient_name,
        expires_at,
        is_revoked,
        created_at,
        watch_logs (
          id,
          is_completed,
          watched_at
        )
      )
    `)
    .eq('doctor_id', user!.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">動画一覧</h1>
          <p className="text-gray-500 mt-1 text-sm">アップロードした患者説明動画を管理します</p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            動画をアップロード
          </Button>
        </Link>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoOff className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">動画がまだありません</h3>
          <p className="text-gray-500 text-sm mb-6">患者説明動画をアップロードして共有しましょう</p>
          <Link href="/dashboard/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              最初の動画をアップロード
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
