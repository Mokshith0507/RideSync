/*
# Add driver rating update function

## Overview
Creates a SECURITY DEFINER function to recalculate a driver's average rating
from all submitted ratings. Called after a passenger submits a rating.

## Function
- update_driver_rating(p_driver_id uuid) - recalculates and updates the driver's rating column
*/

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
