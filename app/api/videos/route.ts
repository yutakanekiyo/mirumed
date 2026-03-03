import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 動画一覧取得
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('doctor_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(videos)
}

// POST: 動画メタデータ保存
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, diseaseCategory, storagePath } = body

  if (!title || !storagePath) {
    return NextResponse.json({ error: 'title and storagePath are required' }, { status: 400 })
  }

  const { data: video, error } = await supabase
    .from('videos')
    .insert({
      doctor_id: user.id,
      title,
      description: description ?? null,
      disease_category: diseaseCategory ?? null,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(video, { status: 201 })
}
