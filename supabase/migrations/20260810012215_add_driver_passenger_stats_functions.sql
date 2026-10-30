/*
# Add driver/passenger stats increment functions

## Overview
Creates SECURITY DEFINER functions to safely increment driver and passenger stats
after a ride is completed. These bypass RLS so the driver can update their own
aggregate counters without needing direct write access to other users' rows.

## Functions
1. increment_driver_stats(p_driver_id uuid, p_amount numeric) - increments total_rides and adds to total_earnings
2. increment_passenger_rides(p_passenger_id uuid) - increments passenger total_rides
*/

CREATE OR REPLACE FUNCTION increment_driver_stats(p_driver_id uuid, p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE drivers
  SET total_rides = total_rides + 1,
      total_earnings = total_earnings + p_amount
  WHERE user_id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_passenger_rides(p_passenger_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE passengers
  SET total_rides = total_rides + 1
  WHERE user_id = p_passenger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
