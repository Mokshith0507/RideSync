import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Bike, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(identifier, password);

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      navigate('/driver');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex items-center justify-center p-4 transition-colors">

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-4 shadow-lg">
            <Bike className="w-9 h-9 text-white dark:text-black" />
          </div>

          <h1 className="text-2xl font-bold text-black dark:text-white">
            RideSync
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Roadside bike ride-sharing
          </p>

          {/* Driver */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30">
            <Bike
              size={16}
              className="text-blue-600 dark:text-blue-400"
            />

            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Driver
            </span>
          </div>

        </div>

        {/* Login Card */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6">

          <div className="flex items-center gap-3 mb-1">

            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-lg font-bold text-black dark:text-white">
              Welcome back
            </h2>

          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 ml-[52px]">
            Sign in to continue 
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email / Phone */}
            <Input
              label="Email or Phone Number"
              type="text"
              placeholder="you@example.com or 9876543210"
              icon={<Mail size={18} />}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
            />

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Sign In */}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="
                w-full
                bg-black
                text-white
                hover:bg-slate-800
                dark:bg-white
                dark:text-black
                dark:hover:bg-slate-200
                border-0
              "
            >
              Sign In
              <LogIn className="ml-2" size={18} />
            </Button>

          </form>

          {/* Register */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}