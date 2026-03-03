import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: 視聴ログを記録（shareId ベース）
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json().catch(() => ({}))
  const { shareId, isCompleted = false, watchDurationSeconds = 0 } = body

  if (!shareId) {
    return NextResponse.json({ error: 'shareId is required' }, { status: 400 })
  }

  // shareの有効性確認
  const { data: share } = await supabase
    .from('video_shares')
    .select('id, is_revoked, expires_at')
    .eq('id', shareId)
    .single()

  if (!share || share.is_revoked || new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid share' }, { status: 403 })
  }

  const { error } = await supabase
    .from('watch_logs')
    .insert({
      share_id: shareId,
      is_completed: isCompleted,
      watch_duration_seconds: watchDurationSeconds,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
