/*
# Add admin access policies

## Overview
Adds RLS policies allowing users with role='admin' in the profiles table
to read all data across drivers, passengers, rides, payments, ratings, and otp_codes.
This enables the admin panel to view and manage all platform data.

## Security
- Admin access is READ-ONLY for all tables (except driver verification status update)
- Only users whose profile.role = 'admin' can use these policies
- Admin can update driver verification_status (to verify drivers)
*/

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin SELECT on drivers
DROP POLICY IF EXISTS "admin_select_drivers" ON drivers;
CREATE POLICY "admin_select_drivers" ON drivers FOR SELECT
  TO authenticated USING (is_admin());

-- Admin UPDATE on drivers (for verification status only)
DROP POLICY IF EXISTS "admin_update_drivers" ON drivers;
CREATE POLICY "admin_update_drivers" ON drivers FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Admin SELECT on passengers
DROP POLICY IF EXISTS "admin_select_passengers" ON passengers;
CREATE POLICY "admin_select_passengers" ON passengers FOR SELECT
  TO authenticated USING (is_admin());

-- Admin SELECT on rides
DROP POLICY IF EXISTS "admin_select_rides" ON rides;
CREATE POLICY "admin_select_rides" ON rides FOR SELECT
  TO authenticated USING (is_admin());

-- Admin SELECT on payments
DROP POLICY IF EXISTS "admin_select_payments" ON payments;
CREATE POLICY "admin_select_payments" ON payments FOR SELECT
  TO authenticated USING (is_admin());

-- Admin SELECT on ratings
DROP POLICY IF EXISTS "admin_select_ratings" ON ratings;
CREATE POLICY "admin_select_ratings" ON ratings FOR SELECT
  TO authenticated USING (is_admin());

-- Admin SELECT on profiles (all users)
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_admin());

-- Admin SELECT on otp_codes
DROP POLICY IF EXISTS "admin_select_otp" ON otp_codes;
CREATE POLICY "admin_select_otp" ON otp_codes FOR SELECT
  TO authenticated USING (is_admin());
