import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { formatDate, formatDuration } from '@/lib/utils'
import ShareHistoryTable from '@/components/dashboard/ShareHistoryTable'
import NewShareButton from '@/components/dashboard/NewShareButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: video } = await supabase
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
          watched_at,
          is_completed,
          watch_duration_seconds
        )
      )
    `)
    .eq('id', id)
    .eq('doctor_id', user!.id)
    .eq('is_active', true)
    .single()

  if (!video) notFound()

  const totalCompleted = video.video_shares?.flatMap(
    (s: { watch_logs: { is_completed: boolean }[] }) =>
      s.watch_logs?.filter((l) => l.is_completed) ?? []
  ).length ?? 0

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 min-h-0"
        >
          <ArrowLeft className="w-4 h-4" />
          動画一覧へ戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {video.disease_category && (
                <Badge variant="info">{video.disease_category}</Badge>
              )}
              {video.duration_seconds && (
                <span className="text-sm text-gray-500">
                  {formatDuration(video.duration_seconds)}
                </span>
              )}
              <span className="text-sm text-gray-400">{formatDate(video.created_at)}</span>
            </div>
            {video.description && (
              <p className="text-sm text-gray-500 mt-2">{video.description}</p>
            )}
          </div>
          <NewShareButton videoId={video.id} videoTitle={video.title} />
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="text-center py-5">
            <p className="text-3xl font-bold text-gray-900">
              {video.video_shares?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">共有リンク発行数</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-5">
            <p className="text-3xl font-bold text-primary">
              {totalCompleted}
            </p>
            <p className="text-sm text-gray-500 mt-1">視聴完了数</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-5">
            <p className="text-3xl font-bold text-gray-900">
              {video.video_shares?.filter(
                (s: { is_revoked: boolean; expires_at: string }) =>
                  !s.is_revoked && new Date(s.expires_at) > new Date()
              ).length ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">有効な共有リンク</p>
          </CardBody>
        </Card>
      </div>

      {/* 共有履歴テーブル */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">共有履歴</h2>
        </CardHeader>
        <ShareHistoryTable shares={video.video_shares ?? []} />
      </Card>
    </div>
  )
}
