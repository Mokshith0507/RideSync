import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route, History, UserCircle, Star, Bike, MapPin, Wallet, QrCode,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePassengerData } from '@/hooks/usePassengerData';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { formatCurrency } from '@/lib/utils';
import { QRModal } from '@/components/QRModal';
import type { Ride } from '@/types';

export function PassengerDashboard() {
  const { profile } = useAuth();
  const { passenger, loading } = usePassengerData(profile?.id);
  const navigate = useNavigate();
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchActiveRide = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('passenger_id', profile.id)
        .in('status', ['PASSENGER_VERIFIED', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setActiveRide(data as Ride);
    };
    fetchActiveRide();

    const channel = supabase
      .channel('passenger-active-ride')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides', filter: `passenger_id=eq.${profile.id}` },
        () => fetchActiveRide()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  if (loading) {
    return (
      <AppLayout title="Passenger Dashboard" showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  const menuItems = [
    {
      label: 'Ride History',
      icon: History,
      path: '/passenger/history',
      color: 'text-slate-600 bg-slate-50',
    },
    {
      label: 'Payment History',
      icon: Wallet,
      path: '/passenger/payments',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Profile',
      icon: UserCircle,
      path: '/passenger/profile',
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <AppLayout title="Passenger Dashboard" showLogout>
      <div className="space-y-5">
        {/* Welcome */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Welcome back,</p>
              <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
              {passenger && (
                <p className="text-sm text-slate-400 mt-0.5">
                  Passenger ID: {passenger.passenger_display_id}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Bike className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">
                {passenger ? passenger.rating.toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-slate-500">Rating</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <Route className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">
                {passenger?.total_rides ?? 0}
              </p>
              <p className="text-xs text-slate-500">Rides Taken</p>
            </div>
          </div>
        </Card>

        {/* My QR code */}
        <Card
          className="p-4 border-blue-200 bg-blue-50"
          onClick={() => passenger?.qr_token && setShowQRModal(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">My QR Code</p>
              <p className="text-sm text-slate-600">Show this to a driver to verify your ride</p>
            </div>
            <QrCode size={20} className="text-blue-600" />
          </div>
        </Card>

        {/* Active ride */}
        {activeRide ? (
          <Card
            className="p-4 border-blue-200 bg-blue-50"
            onClick={() => navigate(`/passenger/ride/${activeRide.id}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Route className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Current Ride: {activeRide.ride_code}</p>
                  <p className="text-sm text-slate-600">
                    {activeRide.starting_location} → {activeRide.destination}
                  </p>
                </div>
              </div>
              <StatusBadge status={activeRide.status} />
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-blue-600 font-medium">
              <MapPin size={14} />
              Tap to view ride details
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={<Bike size={40} />}
              title="No active ride"
              message="Find a Smart Ride bike on the road, check the destination on the LED board, and board the bike."
            />
          </Card>
        )}

        {/* Menu grid */}
        <div className="grid grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="p-4 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate(item.path)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center">{item.label}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {passenger?.qr_token && (
        <QRModal
          open={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrToken={passenger.qr_token}
          passengerDisplayId={passenger.passenger_display_id}
          passengerName={profile?.full_name ?? 'Passenger'}
        />
      )}
    </AppLayout>
  );
}
