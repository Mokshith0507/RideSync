import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Driver } from '@/types';

export function useDriverData(userId: string | undefined) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDriver = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setDriver(data as Driver);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  return { driver, loading, refetch: fetchDriver, setDriver };
}
