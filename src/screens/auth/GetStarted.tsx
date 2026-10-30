import { useNavigate, Navigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function GetStarted() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-slate-900 dark:text-white"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  // Already logged in
  if (session && profile) {
    if (profile.role === 'driver') {
      return <Navigate to="/driver" replace />;
    }

    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    // Passenger dashboard has been removed
    if (profile.role === 'passenger') {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-slate-200/40 dark:bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-200/40 dark:bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-2xl overflow-hidden bg-white">
          <img
            src="/ridesync-logo.jpg"
            alt="RideSync"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          RideSync
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Roadside bike ride-sharing
        </p>

        {/* Feature highlights */}
        <div className="space-y-3 mb-8">

          {/* Feature 1 */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/10 rounded-2xl px-4 py-3 border border-slate-200 dark:border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div>
              <p className="text-black dark:text-white font-semibold text-sm">
                See the destination
              </p>

              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Check the destination before boarding
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/10 rounded-2xl px-4 py-3 border border-slate-200 dark:border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <p className="text-black dark:text-white font-semibold text-sm">
                Safe passenger entry
              </p>

              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Driver records passenger details before the ride
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/10 rounded-2xl px-4 py-3 border border-slate-200 dark:border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>

            <div>
              <p className="text-black dark:text-white font-semibold text-sm">
                Ride & pay
              </p>

              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Simple payment after the ride
              </p>
            </div>
          </div>

        </div>

        {/* Get Started button */}
        <Button
          size="lg"
          onClick={() => navigate('/login')}
          className="
            w-full
            bg-black
            text-white
            hover:bg-slate-800
            active:bg-slate-900
            dark:bg-white
            dark:text-black
            dark:hover:bg-slate-200
            dark:active:bg-slate-300
            shadow-xl
            border-0
          "
        >
          Get Started
          <ArrowRight className="ml-2" size={18} />
        </Button>

        <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-6">
          See. Board. Ride. Pay.
        </p>

      </div>
    </div>
  );
}