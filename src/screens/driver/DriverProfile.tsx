import { useState } from 'react';
import {
  User, Mail, Phone, Bike, ShieldCheck, ShieldAlert,
  Star, TrendingUp, Save,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDriverData } from '@/hooks/useDriverData';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Common';
import { formatCurrency } from '@/lib/utils';

export function DriverProfile() {
  const { profile } = useAuth();
  const { driver, loading, refetch } = useDriverData(profile?.id);
  const [bikeNumber, setBikeNumber] = useState(driver?.bike_number ?? '');
  const [bikeModel, setBikeModel] = useState(driver?.bike_model ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!driver || !profile) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('drivers')
      .update({
        bike_number: bikeNumber,
        bike_model: bikeModel,
      })
      .eq('id', driver.id);

    setSaving(false);
    if (error) {
      setMessage('Failed to update profile: ' + error.message);
    } else {
      setMessage('Profile updated successfully');
      refetch();
    }
  };

  if (loading) {
    return (
      <AppLayout title="Driver Profile" showBack showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Driver Profile" showBack showLogout>
      <div className="space-y-5">
        {/* Profile header */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.full_name}</h2>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              {driver?.verification_status === 'VERIFIED' ? (
                <div className="flex items-center gap-1 mt-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-600">Verified Driver</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <ShieldAlert size={14} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-600">Pending Verification</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{driver?.rating.toFixed(1) ?? '0.0'}</p>
            <p className="text-xs text-slate-500">Rating</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-900">{driver?.total_rides ?? 0}</p>
            <p className="text-xs text-slate-500">Rides</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-lg font-bold text-emerald-600 mt-3">
              {formatCurrency(driver?.total_earnings ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Earnings</p>
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

        {/* Bike details - editable */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Bike Details</h3>
          <div className="space-y-4">
            <Input
              label="Bike Number"
              placeholder="e.g. TS 09 AB 1234"
              icon={<Bike size={18} />}
              value={bikeNumber}
              onChange={(e) => setBikeNumber(e.target.value)}
            />
            <Input
              label="Bike Model"
              placeholder="e.g. Honda Activa 6G"
              value={bikeModel}
              onChange={(e) => setBikeModel(e.target.value)}
            />
            <Button onClick={handleSave} loading={saving} className="w-full">
              <Save size={16} className="mr-1.5" />
              Save Changes
            </Button>
            {message && (
              <p
                className={`text-sm text-center ${
                  message.includes('Failed') ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
