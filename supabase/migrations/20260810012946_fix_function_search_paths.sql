/*
# Fix function search path warnings

## Overview
Sets explicit search_path on all SECURITY DEFINER functions to resolve
the "Function Search Path Mutable" security warnings from the database linter.

## Changes
- Adds `SET search_path = public` to all SECURITY DEFINER functions
- Functions affected: is_admin, increment_driver_stats, increment_passenger_rides, update_driver_rating, generate_passenger_display_id, generate_ride_code, generate_payment_code, update_updated_at_column
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION increment_driver_stats(p_driver_id uuid, p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE drivers
  SET total_rides = total_rides + 1,
      total_earnings = total_earnings + p_amount
  WHERE user_id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_passenger_rides(p_passenger_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE passengers
  SET total_rides = total_rides + 1
  WHERE user_id = p_passenger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_driver_rating(p_driver_id uuid)
RETURNS void AS $$
DECLARE
  avg_rating numeric;
  rating_count integer;
BEGIN
  SELECT COALESCE(AVG(stars), 0), COUNT(*)
  INTO avg_rating, rating_count
  FROM ratings
  WHERE ratee_id = p_driver_id;

  UPDATE drivers
  SET rating = ROUND(avg_rating, 2)
  WHERE user_id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
