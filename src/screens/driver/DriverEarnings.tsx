import { useEffect, useState } from 'react';
import { TrendingUp, IndianRupee, Bike, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDriverData } from '@/hooks/useDriverData';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types';

export function DriverEarnings() {
  const { profile } = useAuth();
  const { driver, loading } = useDriverData(profile?.id);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('payment_status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data as Payment[]);
      }
      setPaymentsLoading(false);
    };
    fetchPayments();
  }, [profile?.id]);

  if (loading || paymentsLoading) {
    return (
      <AppLayout title="Earnings" showBack showLogout>
        <Spinner />
      </AppLayout>
    );
  }

  const recentPayments = payments.slice(0, 5);

  return (
    <AppLayout title="Earnings" showBack showLogout>
      <div className="space-y-5">
        {/* Total earnings card */}
        <Card className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 border-blue-700">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-white" />
            <span className="text-sm font-medium text-blue-50">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(driver?.total_earnings ?? 0)}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-blue-100" />
              <span className="text-sm text-blue-50">{driver?.total_rides ?? 0} completed rides</span>
            </div>
          </div>
        </Card>

        {/* Recent earnings */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Earnings</h3>
          {recentPayments.length === 0 ? (
            <Card className="p-5">
              <EmptyState icon={<IndianRupee size={40} />} title="No earnings yet" message="Your earnings will appear here after you complete rides." />
            </Card>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{payment.payment_code}</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={12} />
                    <span>{formatDate(payment.created_at)}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {payment.payment_method}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All earnings list */}
        {payments.length > 5 && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">All Earnings</h3>
            <div className="space-y-2">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{payment.payment_code}</span>
                      <span className="text-xs text-slate-400">{formatDate(payment.created_at)}</span>
                    </div>
                    <span className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
