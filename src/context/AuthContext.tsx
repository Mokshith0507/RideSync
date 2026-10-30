import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ) => Promise<{ error: string | null }>;
  signIn: (
    identifier: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return;
    }

    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          setSession(session);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }

          setLoading(false);
        })();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      phone: string
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Create driver profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone,
            role: 'driver',
          });

        if (profileError) {
          return { error: profileError.message };
        }

        // Create driver record
        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            user_id: data.user.id,
            bike_number: '',
            bike_model: '',
          });

        if (driverError) {
          return { error: driverError.message };
        }

        await fetchProfile(data.user.id);
      }

      return { error: null };
    },
    [fetchProfile]
  );

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      let email = identifier.trim();

      // Allow login using a 10-digit phone number
      if (/^\d{10}$/.test(email)) {
        const { data: profile, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .eq('phone', email)
          .eq('role', 'driver')
          .maybeSingle();

        if (lookupError || !profile) {
          return {
            error: 'No driver account found with that phone number',
          };
        }

        email = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}