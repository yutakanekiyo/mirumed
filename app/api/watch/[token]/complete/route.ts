import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

// POST: 視聴ログを記録
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabase = await createClient()

  // トークンからshare_idを取得
  const { data: share, error: shareError } = await supabase
    .from('video_shares')
    .select('id, is_revoked, expires_at')
    .eq('token', token)
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  if (share.is_revoked || new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token is invalid' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { isCompleted = false, watchDurationSeconds = 0 } = body

  const { error } = await supabase
    .from('watch_logs')
    .insert({
      share_id: share.id,
      is_completed: isCompleted,
      watch_duration_seconds: watchDurationSeconds,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
