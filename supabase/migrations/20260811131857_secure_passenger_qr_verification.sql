DROP POLICY IF EXISTS "select_passenger_by_qr_token_driver" ON passengers;

CREATE OR REPLACE FUNCTION verify_passenger_qr(p_qr_token text)
RETURNS TABLE (
  user_id uuid,
  passenger_display_id text,
  full_name text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM rides
    WHERE driver_id = auth.uid()
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.passenger_display_id, pr.full_name, pr.phone
  FROM passengers p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE p.qr_token = p_qr_token
    AND pr.role = 'passenger'
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_passenger_qr(text) FROM anon;
GRANT EXECUTE ON FUNCTION verify_passenger_qr(text) TO authenticated;