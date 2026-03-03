-- profiles: 医師プロフィール
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  clinic_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'doctor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- videos: 動画メタデータ
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  disease_category TEXT,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- video_shares: 患者向け共有トークン
CREATE TABLE video_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  patient_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  is_revoked BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- watch_logs: 視聴ログ
CREATE TABLE watch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES video_shares(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  watch_duration_seconds INTEGER DEFAULT 0
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- auth.users INSERT時にprofilesを自動作成するトリガー
-- （メール確認前でもRLSを回避してプロフィールを作成できる）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, clinic_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', ''),
    'doctor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "医師は自分のプロフィールを管理" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Videos policies
CREATE POLICY "医師は自分の動画を管理" ON videos
  FOR ALL USING (auth.uid() = doctor_id);

-- Video shares policies
CREATE POLICY "医師は自分の共有を管理" ON video_shares
  FOR ALL USING (auth.uid() = created_by);

-- video_shares への匿名INSERTは不要。APIサーバーサイドのみで作成。
-- watch_logs policies
CREATE POLICY "認証不要で視聴ログを挿入" ON watch_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "医師は自分の動画の視聴ログを閲覧" ON watch_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM video_shares vs
      JOIN videos v ON v.id = vs.video_id
      WHERE vs.id = watch_logs.share_id AND v.doctor_id = auth.uid()
    )
  );

-- Storage bucket作成（Supabase Dashboardで実行 or CLI）
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('videos', 'videos', false);

-- Storage RLS
-- CREATE POLICY "医師は自分のフォルダに動画をアップロード" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "医師は自分の動画を管理" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
