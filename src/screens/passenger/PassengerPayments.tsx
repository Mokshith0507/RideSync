import { useEffect, useState } from 'react';
import { Wallet, IndianRupee, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Spinner, EmptyState } from '@/components/ui/Common';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types';

export function PassengerPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('passenger_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data as Payment[]);
        const total = (data as Payment[])
          .filter((p) => p.payment_status === 'COMPLETED')
          .reduce((sum, p) => sum + p.amount, 0);
        setTotalSpent(total);
      }
      setLoading(false);
    };
    fetchPayments();
  }, [profile?.id]);

  return (
    <AppLayout title="Payment History" showBack showLogout>
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          {/* Summary card */}
          <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-600">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6 text-white" />
              <span className="text-sm font-medium text-emerald-50">Total Spent</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-emerald-100 mt-1">{payments.length} payment(s)</p>
          </Card>

          {/* Payment list */}
          {payments.length === 0 ? (
            <EmptyState icon={<CreditCard size={40} />} title="No payments yet" message="Your payment history will appear here." />
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{payment.payment_code}</span>
                    <StatusBadge status={payment.payment_status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {payment.payment_method}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(payment.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee size={14} className="text-emerald-500" />
                      <span className="font-bold text-slate-900">{formatCurrency(payment.amount)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
