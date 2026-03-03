import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST: 共有トークン生成 + QRコード生成
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 動画の所有権確認
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('id')
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single()

  if (videoError || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const { patientName } = body

  // 共有トークンを生成（DBのデフォルト値で自動生成）
  const { data: share, error: shareError } = await supabase
    .from('video_shares')
    .insert({
      video_id: id,
      patient_name: patientName ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: shareError?.message ?? 'Share creation failed' }, { status: 500 })
  }

  // 共有URL生成
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const shareUrl = `${siteUrl}/watch/${share.token}`

  // QRコード生成
  const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: '#1A1A2E',
      light: '#FFFFFF',
    },
  })

  return NextResponse.json({
    share,
    shareUrl,
    qrCodeDataUrl,
    patientName: share.patient_name,
    expiresAt: share.expires_at,
  }, { status: 201 })
}
