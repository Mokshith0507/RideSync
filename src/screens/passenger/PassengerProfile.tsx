import { User, Mail, Phone, Star, Route, IdCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePassengerData } from '@/hooks/usePassengerData';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Common';

export function PassengerProfile() {
  const { profile } = useAuth();
  const { passenger, loading } = usePassengerData(profile?.id);

  if (loading) {
    return (
      <AppLayout title="Passenger Profile" showBack showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Passenger Profile" showBack showLogout>
      <div className="space-y-5">
        {/* Profile header */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.full_name}</h2>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              {passenger && (
                <div className="flex items-center gap-1 mt-1">
                  <IdCard size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">
                    ID: {passenger.passenger_display_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">
              {passenger ? passenger.rating.toFixed(1) : '0.0'}
            </p>
            <p className="text-xs text-slate-500">Rating</p>
          </Card>
          <Card className="p-4 text-center">
            <Route className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{passenger?.total_rides ?? 0}</p>
            <p className="text-xs text-slate-500">Rides Taken</p>
          </Card>
        </div>

        {/* Contact info */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-400" />
              <span className="text-sm text-slate-700">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-slate-400" />
              <span className="text-sm text-slate-700">{profile?.phone ?? 'Not set'}</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
