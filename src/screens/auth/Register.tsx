import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  Bike,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '@#$%&*!';

    const randomChar = (chars: string) =>
      chars[Math.floor(Math.random() * chars.length)];

    const generated =
      randomChar(upper) +
      randomChar(lower) +
      randomChar(lower) +
      randomChar(numbers) +
      randomChar(numbers) +
      randomChar(symbols) +
      randomChar(upper) +
      randomChar(lower) +
      randomChar(numbers) +
      randomChar(symbols) +
      randomChar(lower) +
      randomChar(numbers);

    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      email,
      password,
      fullName,
      phone,
    );

    setLoading(false);

    if (error) {
      setError(error);
    } else {
      navigate('/');
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
            Smart Ride
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

        {/* Registration Card */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6">

          <h2 className="text-lg font-bold text-black dark:text-white mb-1">
            Create your account
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Sign up as a driver to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Rahul Sharma"
              icon={<User size={18} />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
            />

            {/* Phone */}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              icon={<Phone size={18} />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={10}
              autoComplete="tel"
              className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
            />

            {/* Password */}
            <div>
              <div className="relative">

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a password"
                  icon={<Lock size={18} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

              <button
                type="button"
                onClick={generatePassword}
                className="flex items-center gap-1.5 mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Sparkles size={15} />
                Suggest a strong password
              </button>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                We'll create an easy-to-copy password for you.
              </p>

            </div>

            {/* Confirm Password */}
            <div className="relative">

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Enter the same password"
                icon={<Lock size={18} />}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                autoComplete="new-password"
                className="bg-white dark:bg-black text-black dark:text-white border-slate-300 dark:border-white/20"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Create Account */}
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
              Create Driver Account
            </Button>

          </form>

          {/* Sign In */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}