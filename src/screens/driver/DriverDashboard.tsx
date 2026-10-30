import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Route, Bike, DollarSign, History, UserCircle,
  ShieldCheck, ShieldAlert, TrendingUp, MapPin, Bluetooth,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDriverData } from '@/hooks/useDriverData';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Spinner } from '@/components/ui/Common';
import { formatCurrency } from '@/lib/utils';
import type { Ride } from '@/types';

export function DriverDashboard() {
  const { profile } = useAuth();
  const { driver, loading } = useDriverData(profile?.id);
  const navigate = useNavigate();

  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [destination, setDestination] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const esp32Url = 'http://192.168.4.1';

  useEffect(() => {
    if (!profile?.id) return;

    const fetchActiveRide = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', profile.id)
        .in('status', ['ACTIVE', 'PASSENGER_VERIFIED', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveRide(data as Ride);

        // Show the current ride destination in the destination box
        if (data.destination) {
          setDestination(data.destination);
        }
      }
    };

    fetchActiveRide();

    const channel = supabase
      .channel('driver-active-ride')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${profile.id}`,
        },
        () => fetchActiveRide()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleSendToLED = async () => {
    const trimmedDestination = destination.trim();

    if (!trimmedDestination) {
      setMessage('Please enter a destination.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);

      try {
        await fetch(
          `${esp32Url}/set?destination=${encodeURIComponent(trimmedDestination)}`,
          {
            method: 'GET',
            mode: 'no-cors',
            signal: controller.signal,
          },
        );
      } finally {
        window.clearTimeout(timeout);
      }

      setMessage('Destination sent to LED.');
    } catch (error) {
      console.error(error);
      setMessage('Could not reach ESP32. Connect to its Wi-Fi and try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Driver Dashboard" showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  const menuItems = [
    {
      label: activeRide ? 'Current Ride' : 'Start Ride',
      icon: activeRide ? Route : Play,
      path: activeRide
        ? `/driver/ride/${activeRide.id}`
        : '/driver/start-ride',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Ride History',
      icon: History,
      path: '/driver/history',
      color: 'text-slate-600 bg-slate-50',
    },
    {
      label: 'Earnings',
      icon: TrendingUp,
      path: '/driver/earnings',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Profile',
      icon: UserCircle,
      path: '/driver/profile',
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <AppLayout title="Driver Dashboard" showLogout>
      <div className="space-y-5">

        {/* Welcome + verification status */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Welcome back,</p>
              <h2 className="text-xl font-bold text-slate-900">
                {profile?.full_name}
              </h2>
            </div>

            {driver?.verification_status === 'VERIFIED' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">
                  Verified Driver
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <ShieldAlert size={16} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">
                  Pending Verification
                </span>
              </div>
            )}
          </div>

          {/* Destination + Rides + Earnings */}
          <div className="grid grid-cols-3 gap-3 mt-5">

            {/* Destination */}
            <div className="col-span-1 p-3 rounded-xl bg-slate-50">
              <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-1" />

              <p className="text-xs font-semibold text-slate-700 text-center mb-2">
                Destination
              </p>

              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="w-full px-2 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleSendToLED}
                disabled={sending}
                className="w-full mt-2 px-2 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Bluetooth size={14} />
                {sending ? 'Sending...' : 'Send to LED'}
              </button>

              {message && (
                <p className="text-[10px] text-center text-slate-500 mt-2">
                  {message}
                </p>
              )}
            </div>

            {/* Rides */}
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <Bike className="w-5 h-5 text-blue-500 mx-auto mb-1" />

              <p className="text-lg font-bold text-slate-900">
                {driver?.total_rides ?? 0}
              </p>

              <p className="text-xs text-slate-500">
                Rides
              </p>
            </div>

            {/* Earnings */}
            <div className="text-center p-3 rounded-xl bg-slate-50">
              <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />

              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(driver?.total_earnings ?? 0)}
              </p>

              <p className="text-xs text-slate-500">
                Earnings
              </p>
            </div>

          </div>
        </Card>

        {/* Active ride banner */}
        {activeRide && (
          <Card
            className="p-4 border-blue-200 bg-blue-50"
            onClick={() => navigate(`/driver/ride/${activeRide.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Route className="w-5 h-5 text-white" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Active Ride: {activeRide.ride_code}
                  </p>

                  <p className="text-sm text-slate-600">
                    {activeRide.starting_location} → {activeRide.destination}
                  </p>
                </div>
              </div>

              <StatusBadge status={activeRide.status} />
            </div>
          </Card>
        )}

        {/* Menu grid */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.label}
                className="p-5 flex flex-col items-center justify-center gap-3"
                onClick={() => navigate(item.path)}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}
                >
                  <Icon size={24} />
                </div>

                <span className="text-sm font-semibold text-slate-700">
                  {item.label}
                </span>
              </Card>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
} 