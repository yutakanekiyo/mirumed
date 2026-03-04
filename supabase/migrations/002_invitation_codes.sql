-- ===================================================
-- 招待コードテーブル
-- ===================================================
CREATE TABLE invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS有効化（直接アクセスは全て拒否、関数経由のみ許可）
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- ===================================================
-- 招待コード検証関数（状態変更なし）
-- anon ロールから呼び出し可能（登録前ユーザー用）
-- ===================================================
CREATE OR REPLACE FUNCTION check_invitation_code(p_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM invitation_codes
    WHERE code = p_code AND is_used = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_invitation_code(TEXT) TO anon;

-- ===================================================
-- 招待コード使用済みマーク関数（アトミック更新）
-- anon ロールから呼び出し可能（登録直後ユーザー用）
-- ===================================================
CREATE OR REPLACE FUNCTION use_invitation_code(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE invitation_codes
  SET is_used = true
  WHERE code = p_code AND is_used = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION use_invitation_code(TEXT) TO anon;

-- ===================================================
-- 招待コード生成ユーティリティ関数
-- Supabase SQL Editor から呼び出して使う
-- 例: SELECT generate_invitation_codes(5);
-- ===================================================
CREATE OR REPLACE FUNCTION generate_invitation_codes(p_count INT DEFAULT 1)
RETURNS TABLE(code TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO invitation_codes (code)
  SELECT
    'MIRU-'
    || upper(substring(encode(gen_random_bytes(3), 'hex') FROM 1 FOR 4))
    || '-'
    || upper(substring(encode(gen_random_bytes(3), 'hex') FROM 1 FOR 4))
  FROM generate_series(1, p_count)
  RETURNING invitation_codes.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- generate_invitation_codes は認証済み管理者のみ（anonには付与しない）

-- ===================================================
-- 使用例（SQL Editor で実行）
-- 招待コードを5件生成:
--   SELECT generate_invitation_codes(5);
--
-- 招待コードを手動で追加:
--   INSERT INTO invitation_codes (code) VALUES ('MIRU-XXXX-YYYY');
--
-- 現在のコード一覧を確認:
--   SELECT * FROM invitation_codes ORDER BY created_at DESC;
-- ===================================================
