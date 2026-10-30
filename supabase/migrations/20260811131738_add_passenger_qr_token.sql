-- Add unique QR token to passengers table
ALTER TABLE passengers 
  ADD COLUMN IF NOT EXISTS qr_token text UNIQUE DEFAULT gen_random_uuid();

-- Backfill existing passengers
UPDATE passengers SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;

-- Policy: drivers can look up a passenger by their QR token (for verification)
CREATE POLICY "select_passenger_by_qr_token_driver"
  ON passengers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rides
      WHERE rides.driver_id = auth.uid()
        AND rides.status = 'ACTIVE'
    )
  );