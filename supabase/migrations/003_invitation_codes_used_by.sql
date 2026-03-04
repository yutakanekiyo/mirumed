-- invitation_codes に使用者情報カラムを追加
ALTER TABLE invitation_codes
  ADD COLUMN used_by UUID REFERENCES auth.users(id),
  ADD COLUMN used_by_email TEXT;

-- use_invitation_code を更新（ユーザー情報も記録）
CREATE OR REPLACE FUNCTION use_invitation_code(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE invitation_codes
  SET
    is_used = true,
    used_by = p_user_id,
    used_by_email = p_user_email
  WHERE code = p_code AND is_used = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION use_invitation_code(TEXT, UUID, TEXT) TO anon;
