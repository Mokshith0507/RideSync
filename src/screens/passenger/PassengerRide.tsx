import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Flag, IndianRupee, Bike, ShieldCheck, User, Clock,
  AlertCircle, Star, CreditCard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Ride, Payment, Driver, Rating } from '@/types';

export function PassengerRide() {
  const { rideId } = useParams<{ rideId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchRide = useCallback(async () => {
    if (!rideId) return;
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setRide(data as Ride);

    // Fetch driver info
    if ((data as Ride).driver_id) {
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', (data as Ride).driver_id)
        .maybeSingle();
      if (driverData) setDriver(driverData as Driver);
    }

    // Fetch payment
    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .eq('ride_id', rideId)
      .maybeSingle();
    if (payData) setPayment(payData as Payment);

    // Check existing rating
    if (profile?.id) {
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('*')
        .eq('ride_id', rideId)
        .eq('rater_id', profile.id)
        .maybeSingle();
      if (ratingData) setExistingRating(ratingData as Rating);
    }

    setLoading(false);
  }, [rideId, profile?.id]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  useEffect(() => {
    if (!rideId) return;
    const channel = supabase
      .channel(`passenger-ride-${rideId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
        () => fetchRide()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `ride_id=eq.${rideId}` },
        () => fetchRide()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, fetchRide]);

  const submitRating = async () => {
    if (!ride || !profile) return;
    setRatingLoading(true);

    const { error } = await supabase.from('ratings').insert({
      ride_id: ride.id,
      rater_id: profile.id,
      ratee_id: ride.driver_id,
      stars: ratingStars,
      review: reviewText || null,
    });

    if (error) {
      alert('Failed to submit rating: ' + error.message);
      setRatingLoading(false);
      return;
    }

    // Update driver's average rating
    await supabase.rpc('update_driver_rating', { p_driver_id: ride.driver_id });

    setRatingLoading(false);
    setShowRatingModal(false);
    fetchRide();
  };

  if (loading) {
    return (
      <AppLayout title="Ride Details" showBack showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  if (!ride) {
    return (
      <AppLayout title="Ride Details" showBack showLogout>
        <EmptyState icon={<AlertCircle size={40} />} title="Ride not found" />
      </AppLayout>
    );
  }

  const isCompleted = ride.status === 'COMPLETED';

  return (
    <AppLayout title={`Ride ${ride.ride_code}`} showBack showLogout>
      <div className="space-y-5">
        {/* Ride status */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bike size={20} className="text-blue-600" />
              <span className="font-bold text-slate-900">{ride.ride_code}</span>
            </div>
            <StatusBadge status={ride.status} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">From</p>
                <p className="text-sm font-medium text-slate-900">{ride.starting_location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Flag size={18} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">To</p>
                <p className="text-sm font-medium text-slate-900">{ride.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IndianRupee size={18} className="text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Fare</p>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(ride.fare)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Started</p>
                <p className="text-sm font-medium text-slate-900">{formatDate(ride.started_at)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Driver info */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Driver Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-400" />
              <span className="text-sm text-slate-900">{ride.driver_name ?? 'Driver'}</span>
            </div>
            {driver && (
              <>
                <div className="flex items-center gap-3">
                  <Bike size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {driver.bike_model || 'Model not set'} • {driver.bike_number || 'Number not set'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {driver.verification_status === 'VERIFIED' ? (
                    <>
                      <ShieldCheck size={18} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-600">Verified Driver</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} className="text-amber-500" />
                      <span className="text-sm font-semibold text-amber-600">Pending Verification</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Star size={18} className="text-amber-400" />
                  <span className="text-sm text-slate-700">
                    {driver.rating.toFixed(1)} rating • {driver.total_rides} rides
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Payment info */}
        {payment ? (
          <Card className="p-5 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={20} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-800">Payment Completed</h3>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Payment ID</span>
                <span className="font-medium text-slate-900">{payment.payment_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Method</span>
                <span className="font-medium text-slate-900">{payment.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amount</span>
                <span className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={20} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Payment</h3>
            </div>
            <p className="text-sm text-slate-500">
              {ride.status === 'COMPLETED'
                ? 'Payment will be recorded by the driver.'
                : 'Payment will be collected after the ride is completed.'}
            </p>
          </Card>
        )}

        {/* Rating section */}
        {isCompleted && (
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Rate Your Ride</h3>
            {existingRating ? (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={24}
                      className={s <= existingRating.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                  ))}
                </div>
                {existingRating.review && (
                  <p className="text-sm text-slate-600 italic">"{existingRating.review}"</p>
                )}
                <p className="text-xs text-slate-400 mt-2">You've already rated this ride</p>
              </div>
            ) : (
              <Button onClick={() => setShowRatingModal(true)} variant="outline" className="w-full">
                <Star size={16} className="mr-1.5" />
                Rate Driver
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Rating modal */}
      <Modal open={showRatingModal} onClose={() => setShowRatingModal(false)} title="Rate Your Driver">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-3">How was your ride with {ride.driver_name}?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRatingStars(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={s <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Review (optional)
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              rows={3}
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <Button variant="success" size="lg" loading={ratingLoading} onClick={submitRating} className="w-full">
            Submit Rating
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
