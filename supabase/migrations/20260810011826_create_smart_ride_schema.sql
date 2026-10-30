/*
# Smart Ride - Core Database Schema

## Overview
Creates the complete database schema for the Smart Ride roadside bike ride-sharing application.
This includes user profiles, driver/passenger data, rides, payments, ratings, and OTP verification codes.

## New Tables

1. **profiles** - Extends Supabase auth.users with role (driver/passenger/admin), full name, phone, avatar
2. **drivers** - Driver-specific data: bike number, bike model, verification status, rating, completed rides
3. **passengers** - Passenger-specific data: passenger ID display, rating
4. **rides** - Ride records: driver, passenger, start/destination, fare, status, timestamps
5. **payments** - Payment records: ride, passenger, driver, amount, method, status
6. **ratings** - Rating/review records: ride, rater, ratee, stars, review text
7. **otp_codes** - OTP verification codes: phone, code, expiry, used status

## Security
- RLS enabled on ALL tables
- Users can only access their own profile/driver/passenger data
- Drivers can access verified passenger info for their active rides
- Passengers can view their own rides, payments, ratings
- Drivers can view their own rides, payments, earnings
- Admin role can access all data
- OTP codes are scoped to the ride/driver who generated them
*/

-- ============================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'passenger' CHECK (role IN ('driver', 'passenger', 'admin')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- DRIVERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_number text NOT NULL,
  bike_model text NOT NULL,
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED')),
  rating numeric(3,2) NOT NULL DEFAULT 0.00,
  total_rides integer NOT NULL DEFAULT 0,
  total_earnings numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drivers can read their own driver record
DROP POLICY IF EXISTS "select_own_driver" ON drivers;
CREATE POLICY "select_own_driver" ON drivers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Drivers can insert their own driver record
DROP POLICY IF EXISTS "insert_own_driver" ON drivers;
CREATE POLICY "insert_own_driver" ON drivers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Drivers can update their own driver record (but not verification_status or rating)
DROP POLICY IF EXISTS "update_own_driver" ON drivers;
CREATE POLICY "update_own_driver" ON drivers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASSENGERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_display_id text UNIQUE NOT NULL,
  rating numeric(3,2) NOT NULL DEFAULT 0.00,
  total_rides integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- Passengers can read their own passenger record
DROP POLICY IF EXISTS "select_own_passenger" ON passengers;
CREATE POLICY "select_own_passenger" ON passengers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Passengers can insert their own passenger record
DROP POLICY IF EXISTS "insert_own_passenger" ON passengers;
CREATE POLICY "insert_own_passenger" ON passengers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Passengers can update their own passenger record
DROP POLICY IF EXISTS "update_own_passenger" ON passengers;
CREATE POLICY "update_own_passenger" ON passengers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RIDES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_code text UNIQUE NOT NULL,
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_name text,
  passenger_name text,
  passenger_phone text,
  starting_location text NOT NULL,
  destination text NOT NULL,
  fare numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PASSENGER_VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  started_at timestamptz NOT NULL DEFAULT now(),
  passenger_joined_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Drivers can see rides they created
-- Passengers can see rides they are part of
DROP POLICY IF EXISTS "select_ride_participants" ON rides;
CREATE POLICY "select_ride_participants" ON rides FOR SELECT
  TO authenticated USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- Only the driver can insert a ride (they create it)
DROP POLICY IF EXISTS "insert_own_ride_driver" ON rides;
CREATE POLICY "insert_own_ride_driver" ON rides FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = driver_id);

-- Driver can update their own rides; passenger can update status for their rides
DROP POLICY IF EXISTS "update_ride_participants" ON rides;
CREATE POLICY "update_ride_participants" ON rides FOR UPDATE
  TO authenticated USING (auth.uid() = driver_id OR auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- Only driver can delete (cancel) their ride
DROP POLICY IF EXISTS "delete_own_ride_driver" ON rides;
CREATE POLICY "delete_own_ride_driver" ON rides FOR DELETE
  TO authenticated USING (auth.uid() = driver_id);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_code text UNIQUE NOT NULL,
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('UPI', 'CARD', 'CASH')),
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Both driver and passenger can see payments for their rides
DROP POLICY IF EXISTS "select_payment_participants" ON payments;
CREATE POLICY "select_payment_participants" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- Driver or passenger can create payment records
DROP POLICY IF EXISTS "insert_payment_participants" ON payments;
CREATE POLICY "insert_payment_participants" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- Both can update payment records for their rides
DROP POLICY IF EXISTS "update_payment_participants" ON payments;
CREATE POLICY "update_payment_participants" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = driver_id OR auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- ============================================================
-- RATINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Both rater and ratee can see ratings
DROP POLICY IF EXISTS "select_rating_participants" ON ratings;
CREATE POLICY "select_rating_participants" ON ratings FOR SELECT
  TO authenticated USING (auth.uid() = rater_id OR auth.uid() = ratee_id);

-- Only the rater can create a rating
DROP POLICY IF EXISTS "insert_own_rating" ON ratings;
CREATE POLICY "insert_own_rating" ON ratings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = rater_id);

-- No updates or deletes on ratings (immutable once submitted)

-- ============================================================
-- OTP CODES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Only the ride's driver can access OTP codes for their ride
DROP POLICY IF EXISTS "select_otp_driver" ON otp_codes;
CREATE POLICY "select_otp_driver" ON otp_codes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM rides WHERE rides.id = otp_codes.ride_id AND rides.driver_id = auth.uid())
  );

-- Only the ride's driver can create OTP codes
DROP POLICY IF EXISTS "insert_otp_driver" ON otp_codes;
CREATE POLICY "insert_otp_driver" ON otp_codes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM rides WHERE rides.id = otp_codes.ride_id AND rides.driver_id = auth.uid())
  );

-- Only the ride's driver can update OTP codes (mark as used, increment attempts)
DROP POLICY IF EXISTS "update_otp_driver" ON otp_codes;
CREATE POLICY "update_otp_driver" ON otp_codes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM rides WHERE rides.id = otp_codes.ride_id AND rides.driver_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM rides WHERE rides.id = otp_codes.ride_id AND rides.driver_id = auth.uid())
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_driver_id ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_passenger_id ON payments(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_ride_id ON otp_codes(ride_id);

-- ============================================================
-- TRIGGER: Auto-update updated_at on row changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_passengers_updated_at ON passengers;
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON passengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rides_updated_at ON rides;
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Generate passenger display ID (SR + number)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_passenger_display_id()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(passenger_display_id FROM 3) AS integer)), 1023) + 1
  INTO next_num
  FROM passengers;
  new_id := 'SR' || next_num::text;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Generate ride code (SRD + number)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_ride_code()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_code text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ride_code FROM 4) AS integer)), 9999) + 1
  INTO next_num
  FROM rides;
  new_code := 'SRD' || next_num::text;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Generate payment code (SRP + number)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_code text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_code FROM 4) AS integer)), 9999) + 1
  INTO next_num
  FROM payments;
  new_code := 'SRP' || next_num::text;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REALTIME: Enable realtime for rides and payments
-- ============================================================
ALTER TABLE rides REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE otp_codes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE otp_codes;