import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck, User, MapPin, Flag, IndianRupee, Phone,
  CheckCircle2, AlertCircle, Bike, Clock, Play, XCircle, CreditCard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { maskPhone, formatCurrency, formatDate } from '@/lib/utils';
import type { Ride, Payment, PaymentMethod } from '@/types';

export function ActiveRide() {
  const { rideId } = useParams<{ rideId: string }>();
  const { profile } = useAuth();

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerError, setPassengerError] = useState<string | null>(null);
  const [passengerLoading, setPassengerLoading] = useState(false);

  const [passengerProfile, setPassengerProfile] = useState<{
    full_name: string;
    phone: string;
  } | null>(null);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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

    const currentRide = data as Ride;
    setRide(currentRide);

    /*
     * If the passenger is a registered Smart Ride user,
     * fetch their profile.
     *
     * For a passenger entered manually by the driver,
     * passenger_id will be NULL, so we use the name and
     * phone stored directly in the ride.
     */
    if (currentRide.passenger_id) {
      const { data: pProfile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', currentRide.passenger_id)
        .maybeSingle();

      if (pProfile) {
        setPassengerProfile(
          pProfile as { full_name: string; phone: string }
        );
      }
    } else if (currentRide.passenger_name) {
      setPassengerProfile({
        full_name: currentRide.passenger_name,
        phone: currentRide.passenger_phone ?? '',
      });
    }

    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .eq('ride_id', rideId)
      .maybeSingle();

    if (payData) {
      setPayment(payData as Payment);
    }

    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        () => fetchRide()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `ride_id=eq.${rideId}`,
        },
        () => fetchRide()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, fetchRide]);

  const handleAddPassenger = async () => {
    if (!ride) return;

    setPassengerError(null);

    const trimmedName = passengerName.trim();
    const trimmedPhone = passengerPhone.trim();

    if (!trimmedName) {
      setPassengerError('Please enter the passenger name.');
      return;
    }

    if (!/^[A-Za-z ]+$/.test(trimmedName)) {
      setPassengerError('Passenger name should contain only letters and spaces.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      setPassengerError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setPassengerLoading(true);

    const { error } = await supabase
      .from('rides')
      .update({
        passenger_id: null,
        passenger_name: trimmedName,
        passenger_phone: trimmedPhone,
        status: 'PASSENGER_VERIFIED',
        passenger_joined_at: new Date().toISOString(),
      })
      .eq('id', ride.id)
      .eq('status', 'ACTIVE');

    setPassengerLoading(false);

    if (error) {
      setPassengerError(
        'Failed to add passenger. Please try again.'
      );
      return;
    }

    setPassengerProfile({
      full_name: trimmedName,
      phone: trimmedPhone,
    });

    setPassengerName('');
    setPassengerPhone('');

    await fetchRide();
  };

  const updateRideStatus = async (status: Ride['status']) => {
    if (!ride) return;

    setStatusUpdating(true);

    const updates: Record<string, unknown> = { status };

    if (status === 'COMPLETED') {
      updates.completed_at = new Date().toISOString();
    }

    if (status === 'IN_PROGRESS') {
      updates.started_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', ride.id);

    setStatusUpdating(false);

    if (error) {
      alert('Failed to update status: ' + error.message);
      return;
    }

    if (status === 'COMPLETED') {
      // Update driver statistics
      await supabase.rpc('increment_driver_stats', {
        p_driver_id: ride.driver_id,
        p_amount: ride.fare,
      });

      /*
       * Only update passenger statistics if this is a
       * registered passenger.
       *
       * Driver-entered passengers have passenger_id = NULL.
       */
      if (ride.passenger_id) {
        await supabase.rpc('increment_passenger_rides', {
          p_passenger_id: ride.passenger_id,
        });
      }
    }

    await fetchRide();
  };

  const handlePayment = async () => {
    if (!ride || !profile) return;

    setPaymentLoading(true);

    const { data: paymentCode, error: codeError } = await supabase.rpc(
      'generate_payment_code'
    );

    if (codeError || !paymentCode) {
      setPaymentLoading(false);
      alert('Unable to generate payment ID. Please try again.');
      return;
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        payment_code: paymentCode,
        ride_id: ride.id,

        /*
         * This can be NULL for a passenger entered manually
         * by the driver.
         */
        passenger_id: ride.passenger_id ?? null,

        driver_id: ride.driver_id,
        amount: ride.fare,
        payment_method: paymentMethod,
        payment_status: 'COMPLETED',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    setPaymentLoading(false);

    if (error) {
      alert('Payment failed: ' + error.message);
      return;
    }

    setPayment(data as Payment);
    setShowPaymentModal(false);

    await fetchRide();
  };

  if (loading) {
    return (
      <AppLayout title="Active Ride" showBack showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  if (!ride) {
    return (
      <AppLayout title="Active Ride" showBack showLogout>
        <EmptyState
          icon={<AlertCircle size={40} />}
          title="Ride not found"
        />
      </AppLayout>
    );
  }

  const isCompleted = ride.status === 'COMPLETED';
  const isCancelled = ride.status === 'CANCELLED';

  const hasPassenger =
    !!ride.passenger_name || !!passengerProfile;

  return (
    <AppLayout title={`Ride ${ride.ride_code}`} showBack showLogout>
      <div className="space-y-5">

        {/* Ride info */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bike size={20} className="text-blue-600" />
              <span className="font-bold text-slate-900">
                {ride.ride_code}
              </span>
            </div>

            <StatusBadge status={ride.status} />
          </div>

          <div className="space-y-3">

            <div className="flex items-center gap-3">
              <MapPin
                size={18}
                className="text-slate-400 flex-shrink-0"
              />
              <div>
                <p className="text-xs text-slate-500">From</p>
                <p className="text-sm font-medium text-slate-900">
                  {ride.starting_location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Flag
                size={18}
                className="text-blue-500 flex-shrink-0"
              />
              <div>
                <p className="text-xs text-slate-500">To</p>
                <p className="text-sm font-medium text-slate-900">
                  {ride.destination}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <IndianRupee
                size={18}
                className="text-emerald-500 flex-shrink-0"
              />
              <div>
                <p className="text-xs text-slate-500">Fare</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatCurrency(ride.fare)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock
                size={18}
                className="text-slate-400 flex-shrink-0"
              />
              <div>
                <p className="text-xs text-slate-500">Started</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatDate(ride.started_at)}
                </p>
              </div>
            </div>

          </div>
        </Card>

        {/* Add passenger */}
        {ride.status === 'ACTIVE' && !hasPassenger && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <User size={20} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Add Passenger
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enter the passenger details after they board your bike.
            </p>

            <div className="space-y-4">

              <Input
                label="Passenger Name"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Enter passenger name"
                disabled={passengerLoading}
              />

              <Input
                label="Phone Number"
                type="tel"
                value={passengerPhone}
                onChange={(e) =>
                  setPassengerPhone(
                    e.target.value.replace(/\D/g, '').slice(0, 10)
                  )
                }
                placeholder="10-digit mobile number"
                maxLength={10}
                disabled={passengerLoading}
              />

              {passengerError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={17}
                      className="text-red-500 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-red-600">
                      {passengerError}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddPassenger}
                loading={passengerLoading}
                className="w-full"
              >
                <CheckCircle2 size={17} className="mr-1.5" />
                Confirm Passenger
              </Button>

            </div>
          </Card>
        )}

        {/* Passenger details */}
        {hasPassenger && (
          <Card className="p-5 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck
                size={20}
                className="text-emerald-600"
              />
              <h3 className="text-sm font-bold text-emerald-800">
                Passenger Added
              </h3>
            </div>

            <div className="space-y-2">

              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400" />
                <span className="text-sm text-slate-900">
                  {ride.passenger_name ||
                    passengerProfile?.full_name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400" />
                <span className="text-sm text-slate-700">
                  {maskPhone(
                    ride.passenger_phone ||
                    passengerProfile?.phone ||
                    ''
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-slate-400" />
                <span className="text-sm text-slate-700">
                  {ride.starting_location} → {ride.destination}
                </span>
              </div>

            </div>
          </Card>
        )}

        {/* Payment section */}
        {hasPassenger &&
          !payment &&
          ride.status !== 'CANCELLED' && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Payment
              </h3>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-600">
                  Fare to collect
                </span>

                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(ride.fare)}
                </span>
              </div>

              <Button
                onClick={() => setShowPaymentModal(true)}
                className="w-full"
              >
                <CreditCard size={16} className="mr-1.5" />
                Record Payment
              </Button>
            </Card>
          )}

        {/* Payment completed */}
        {payment && (
          <Card className="p-5 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2
                size={20}
                className="text-emerald-600"
              />
              <h3 className="text-sm font-bold text-emerald-800">
                Payment Completed
              </h3>
            </div>

            <div className="space-y-1.5 text-sm">

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Payment ID
                </span>
                <span className="font-medium text-slate-900">
                  {payment.payment_code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Method
                </span>
                <span className="font-medium text-slate-900">
                  {payment.payment_method}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">
                  Amount
                </span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

            </div>
          </Card>
        )}

        {/* Ride controls */}
        {!isCompleted && !isCancelled && (
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Ride Controls
            </h3>

            <div className="space-y-3">

              {ride.status === 'PASSENGER_VERIFIED' && (
                <Button
                  variant="primary"
                  size="lg"
                  loading={statusUpdating}
                  onClick={() =>
                    updateRideStatus('IN_PROGRESS')
                  }
                  className="w-full"
                >
                  <Play size={18} className="mr-1.5" />
                  Start Ride (In Progress)
                </Button>
              )}

              {ride.status === 'IN_PROGRESS' && (
                <Button
                  variant="success"
                  size="lg"
                  loading={statusUpdating}
                  onClick={() =>
                    updateRideStatus('COMPLETED')
                  }
                  className="w-full"
                >
                  <CheckCircle2 size={18} className="mr-1.5" />
                  Complete Ride
                </Button>
              )}

              {ride.status === 'ACTIVE' && (
                <Button
                  variant="danger"
                  size="lg"
                  loading={statusUpdating}
                  onClick={() =>
                    updateRideStatus('CANCELLED')
                  }
                  className="w-full"
                >
                  <XCircle size={18} className="mr-1.5" />
                  Cancel Ride
                </Button>
              )}

            </div>
          </Card>
        )}

        {/* Completed state */}
        {isCompleted && (
          <Card className="p-5 text-center">
            <CheckCircle2
              size={40}
              className="text-emerald-600 mx-auto mb-2"
            />

            <p className="font-bold text-slate-900">
              Ride Completed
            </p>

            {ride.completed_at && (
              <p className="text-sm text-slate-500 mt-1">
                {formatDate(ride.completed_at)}
              </p>
            )}
          </Card>
        )}

      </div>

      {/* Payment modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <div className="space-y-4">

          <div className="text-center py-4">
            <p className="text-sm text-slate-500">
              Fare Amount
            </p>

            <p className="text-3xl font-bold text-emerald-600">
              {formatCurrency(ride.fare)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Payment Method
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'CASH'] as PaymentMethod[]).map(
                (method) => (
                  <button
                    key={method}
                    onClick={() =>
                      setPaymentMethod(method)
                    }
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      paymentMethod === method
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-xs text-blue-600">
              This is a mock payment for prototype purposes.
              In production, a real payment gateway would be
              integrated here.
            </p>
          </div>

          <Button
            variant="success"
            size="lg"
            loading={paymentLoading}
            onClick={handlePayment}
            className="w-full"
          >
            <CheckCircle2 size={18} className="mr-1.5" />
            Confirm Payment
          </Button>

        </div>
      </Modal>

    </AppLayout>
  );
}