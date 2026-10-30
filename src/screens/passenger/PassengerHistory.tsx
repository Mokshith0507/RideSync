import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, MapPin, IndianRupee, ChevronRight, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Ride } from '@/types';

export function PassengerHistory() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchRides = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('passenger_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRides(data as Ride[]);
      }
      setLoading(false);
    };
    fetchRides();
  }, [profile?.id]);

  return (
    <AppLayout title="Ride History" showBack showLogout>
      {loading ? (
        <Spinner />
      ) : rides.length === 0 ? (
        <EmptyState icon={<History size={40} />} title="No rides yet" message="Your ride history will appear here after you complete a ride." />
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <Card
              key={ride.id}
              className="p-4"
              onClick={() => navigate(`/passenger/ride/${ride.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">{ride.ride_code}</span>
                <StatusBadge status={ride.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <MapPin size={14} className="text-slate-400" />
                <span>{ride.starting_location} → {ride.destination}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">{ride.driver_name ?? 'Driver'}</span>
                  <span className="text-xs text-slate-400">• {formatDate(ride.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee size={14} className="text-emerald-500" />
                  <span className="font-semibold text-slate-900">{formatCurrency(ride.fare)}</span>
                  <ChevronRight size={16} className="text-slate-300 ml-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
