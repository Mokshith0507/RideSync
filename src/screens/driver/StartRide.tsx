import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Flag, IndianRupee, Bike, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDriverData } from '@/hooks/useDriverData';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Common';

export function StartRide() {
  const { profile } = useAuth();
  const { driver, loading } = useDriverData(profile?.id);
  const navigate = useNavigate();
  const [startingLocation, setStartingLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile?.id) return;

    const fareNum = parseFloat(fare);
    if (isNaN(fareNum) || fareNum <= 0) {
      setError('Please enter a valid fare amount');
      return;
    }

    setSubmitting(true);

    const { data: rideCode } = await supabase.rpc('generate_ride_code');

    const { data, error: insertError } = await supabase
      .from('rides')
      .insert({
        ride_code: rideCode,
        driver_id: profile.id,
        driver_name: profile.full_name,
        starting_location: startingLocation,
        destination,
        fare: fareNum,
        status: 'ACTIVE',
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate(`/driver/ride/${data.id}`);
  };

  if (loading) {
    return (
      <AppLayout title="Start Ride" showBack showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Start Ride" showBack showLogout>
      <div className="space-y-5">
        {/* Info banner */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Enter ride details</p>
              <p className="text-xs text-slate-600 mt-0.5">
                The destination will be displayed on your physical LED board (hardware). This app stores the ride record only.
              </p>
            </div>
          </div>
        </Card>

        {/* Bike info */}
        {driver && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Bike size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {driver.bike_model || 'Bike model not set'}
                </p>
                <p className="text-xs text-slate-500">
                  {driver.bike_number || 'Bike number not set'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Ride form */}
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Starting Location"
              placeholder="e.g. CMRCET Campus"
              icon={<MapPin size={18} />}
              value={startingLocation}
              onChange={(e) => setStartingLocation(e.target.value)}
              required
            />
            <Input
              label="Destination"
              placeholder="e.g. Kompally"
              icon={<Flag size={18} />}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <Input
              label="Fare (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 50"
              icon={<IndianRupee size={18} />}
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              <CheckCircle2 size={18} className="mr-1.5" />
              Start Ride
            </Button>
          </form>
        </Card>

        {/* Flow reminder */}
        <div className="text-center text-xs text-slate-400 px-4">
          After starting, the destination shows on your LED board. Passengers board, then you verify them with OTP.
        </div>
      </div>
    </AppLayout>
  );
}
