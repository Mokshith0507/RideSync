import { useEffect, useState } from 'react';
import {
  ShieldCheck, ShieldAlert, Users, Bike, Route, CreditCard, Star,
  CheckCircle2, User, Phone, Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Driver, Profile, Ride, Payment, Rating } from '@/types';

type Tab = 'drivers' | 'users' | 'rides' | 'payments' | 'ratings';

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('drivers');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverProfiles, setDriverProfiles] = useState<Record<string, Profile>>({});
  const [users, setUsers] = useState<Profile[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    const [driversRes, usersRes, ridesRes, paymentsRes, ratingsRes] = await Promise.all([
      supabase.from('drivers').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('rides').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('ratings').select('*').order('created_at', { ascending: false }),
    ]);

    if (driversRes.data) {
      setDrivers(driversRes.data as Driver[]);
      const profileIds = (driversRes.data as Driver[]).map((d) => d.user_id);
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);
        if (profiles) {
          const map: Record<string, Profile> = {};
          (profiles as Profile[]).forEach((p) => { map[p.id] = p; });
          setDriverProfiles(map);
        }
      }
    }
    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (ridesRes.data) setRides(ridesRes.data as Ride[]);
    if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
    if (ratingsRes.data) setRatings(ratingsRes.data as Rating[]);

    setLoading(false);
  };

  const handleVerify = async (driverId: string) => {
    setVerifying(driverId);
    await supabase
      .from('drivers')
      .update({ verification_status: 'VERIFIED' })
      .eq('id', driverId);
    setVerifying(null);
    fetchAll();
  };

  const handleUnverify = async (driverId: string) => {
    setVerifying(driverId);
    await supabase
      .from('drivers')
      .update({ verification_status: 'PENDING' })
      .eq('id', driverId);
    setVerifying(null);
    fetchAll();
  };

  const tabs: { id: Tab; label: string; icon: typeof Users; count: number }[] = [
    { id: 'drivers', label: 'Drivers', icon: Bike, count: drivers.length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'rides', label: 'Rides', icon: Route, count: rides.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'ratings', label: 'Ratings', icon: Star, count: ratings.length },
  ];

  return (
    <AppLayout title="Admin Panel" showBack showLogout>
      <div className="space-y-5">
        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{users.length}</p>
            <p className="text-xs text-slate-500">Users</p>
          </Card>
          <Card className="p-3 text-center">
            <Route className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{rides.length}</p>
            <p className="text-xs text-slate-500">Rides</p>
          </Card>
          <Card className="p-3 text-center">
            <CreditCard className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{payments.length}</p>
            <p className="text-xs text-slate-500">Payments</p>
          </Card>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-blue-500' : 'bg-slate-100'}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Drivers tab */}
            {tab === 'drivers' && (
              <div className="space-y-3">
                {drivers.length === 0 ? (
                  <EmptyState icon={<Bike size={40} />} title="No drivers registered" />
                ) : (
                  drivers.map((driver) => {
                    const profile = driverProfiles[driver.user_id];
                    return (
                      <Card key={driver.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{profile?.full_name ?? 'Unknown'}</p>
                              <p className="text-xs text-slate-500">
                                {driver.bike_number || 'No bike number'} • {driver.bike_model || 'No model'}
                              </p>
                            </div>
                          </div>
                          {driver.verification_status === 'VERIFIED' ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                              <ShieldCheck size={14} className="text-emerald-600" />
                              <span className="text-xs font-semibold text-emerald-700">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
                              <ShieldAlert size={14} className="text-amber-600" />
                              <span className="text-xs font-semibold text-amber-700">Pending</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span>Rating: {driver.rating.toFixed(1)}</span>
                          <span>Rides: {driver.total_rides}</span>
                          <span>Earnings: {formatCurrency(driver.total_earnings)}</span>
                        </div>
                        {driver.verification_status === 'PENDING' ? (
                          <Button
                            size="sm"
                            variant="success"
                            loading={verifying === driver.id}
                            onClick={() => handleVerify(driver.id)}
                            className="w-full"
                          >
                            <CheckCircle2 size={14} className="mr-1" />
                            Verify Driver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={verifying === driver.id}
                            onClick={() => handleUnverify(driver.id)}
                            className="w-full"
                          >
                            <ShieldAlert size={14} className="mr-1" />
                            Revoke Verification
                          </Button>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* Users tab */}
            {tab === 'users' && (
              <div className="space-y-3">
                {users.length === 0 ? (
                  <EmptyState icon={<Users size={40} />} title="No users registered" />
                ) : (
                  users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{user.full_name}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail size={12} /> {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          user.role === 'driver' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Rides tab */}
            {tab === 'rides' && (
              <div className="space-y-3">
                {rides.length === 0 ? (
                  <EmptyState icon={<Route size={40} />} title="No rides yet" />
                ) : (
                  rides.map((ride) => (
                    <Card key={ride.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{ride.ride_code}</span>
                        <StatusBadge status={ride.status} />
                      </div>
                      <p className="text-sm text-slate-600">
                        {ride.starting_location} → {ride.destination}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span>Driver: {ride.driver_name ?? '—'}</span>
                        <span>Passenger: {ride.passenger_name ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                        <span>{formatDate(ride.created_at)}</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(ride.fare)}</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Payments tab */}
            {tab === 'payments' && (
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <EmptyState icon={<CreditCard size={40} />} title="No payments yet" />
                ) : (
                  payments.map((payment) => (
                    <Card key={payment.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{payment.payment_code}</span>
                        <StatusBadge status={payment.payment_status} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                          {payment.payment_method}
                        </span>
                        <span className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(payment.created_at)}</p>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Ratings tab */}
            {tab === 'ratings' && (
              <div className="space-y-3">
                {ratings.length === 0 ? (
                  <EmptyState icon={<Star size={40} />} title="No ratings yet" />
                ) : (
                  ratings.map((rating) => (
                    <Card key={rating.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={16}
                              className={s <= rating.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(rating.created_at)}</span>
                      </div>
                      {rating.review && (
                        <p className="text-sm text-slate-600 italic">"{rating.review}"</p>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
