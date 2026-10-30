import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Passenger } from '@/types';

export function usePassengerData(userId: string | undefined) {
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPassenger = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('passengers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setPassenger(data as Passenger);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPassenger();
  }, [fetchPassenger]);

  return { passenger, loading, refetch: fetchPassenger, setPassenger };
}
