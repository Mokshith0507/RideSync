export type UserRole = 'driver' | 'passenger' | 'admin';

export type VerificationStatus = 'PENDING' | 'VERIFIED';

export type RideStatus =
  | 'ACTIVE'
  | 'PASSENGER_VERIFIED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CASH';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  bike_number: string;
  bike_model: string;
  verification_status: VerificationStatus;
  rating: number;
  total_rides: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface Passenger {
  id: string;
  user_id: string;
  passenger_display_id: string;
  qr_token: string | null;
  rating: number;
  total_rides: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  ride_code: string;
  driver_id: string;
  passenger_id: string | null;
  driver_name: string | null;
  passenger_name: string | null;
  passenger_phone: string | null;
  starting_location: string;
  destination: string;
  fare: number;
  status: RideStatus;
  started_at: string;
  passenger_joined_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_code: string;
  ride_id: string;
  passenger_id: string | null;
  driver_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  ride_id: string;
  rater_id: string;
  ratee_id: string;
  stars: number;
  review: string | null;
  created_at: string;
}
