import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

// GET: トークン検証 + 署名付きURL発行
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabase = await createClient()

  // トークンの検証
  const { data: share, error: shareError } = await supabase
    .from('video_shares')
    .select(`
      id,
      token,
      patient_name,
      expires_at,
      is_revoked,
      videos (
        id,
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

  if (shareError || !share) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  // 失効チェック
  if (share.is_revoked) {
    return NextResponse.json({ error: 'Token has been revoked' }, { status: 403 })
  }

  // 期限チェック
  if (new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token has expired' }, { status: 403 })
  }

  const video = share.videos as unknown as {
    id: string
    title: string
    description: string | null
    storage_path: string
    profiles: { full_name: string; clinic_name: string } | null
  } | null

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  // Supabase Storage から署名付きURL生成（1時間有効）
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('videos')
    .createSignedUrl(video.storage_path, 3600)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate video URL' }, { status: 500 })
  }

  return NextResponse.json({
    shareId: share.id,
    videoUrl: signedUrlData.signedUrl,
    title: video.title,
    description: video.description,
    patientName: share.patient_name,
    clinicName: video.profiles?.clinic_name ?? '',
    doctorName: video.profiles?.full_name ?? '',
  })
}
