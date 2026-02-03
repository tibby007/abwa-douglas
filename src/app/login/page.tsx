'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, loading: authLoading, checkPositionAvailability } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [takenPositions, setTakenPositions] = useState<string[]>([]);

  // Fetch taken officer positions on mount
  useEffect(() => {
    const fetchTakenPositions = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .in('role', ['treasurer', 'president', 'vice_president', 'secretary']);

        if (error) {
          console.error('Error fetching taken positions:', error);
          return;
        }

        if (data) {
          setTakenPositions(data.map(p => p.role));
        }
      } catch (err) {
        console.error('Error fetching taken positions:', err);
      }
    };

    fetchTakenPositions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          router.push('/');
        }
      } else {
        // Signup mode
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }

        // Check if officer position is available before attempting signup
        if (role !== 'member') {
          try {
            const { available, takenBy } = await checkPositionAvailability(role);
            if (!available) {
              const roleLabel = roleOptions.find(r => r.value === role)?.label || role;
              setError(`The ${roleLabel} position is already held${takenBy ? ` by ${takenBy}` : ''}. Please select a different role.`);
              setLoading(false);
              return;
            }
          } catch (err) {
            setError('Unable to verify role availability. Please try again.');
            setLoading(false);
            return;
          }
        }

        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          // Handle database constraint violation errors
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            const roleLabel = roleOptions.find(r => r.value === role)?.label || role;
            setError(`The ${roleLabel} position was just taken by another user. Please select a different role.`);
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Account created! Please check your email to confirm your account.');
          setMode('login');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'treasurer', label: 'Treasurer', description: 'Full access to all features' },
    { value: 'president', label: 'President', description: 'View finances, submit requests' },
    { value: 'vice_president', label: 'Vice President', description: 'View finances, submit requests' },
    { value: 'secretary', label: 'Secretary', description: 'View finances, submit requests' },
    { value: 'member', label: 'Member', description: 'Limited view access' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-900 via-rose-800 to-rose-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
              <div className="flex h-full w-full flex-col items-center justify-center rounded border border-slate-100">
                <span className="text-2xl font-black tracking-tighter text-rose-800 leading-none">ABWA</span>
                <div className="my-1 h-0.5 w-10 bg-amber-400"></div>
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-800">Douglas</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">ABWA-Douglas Chapter</h1>
          <p className="text-rose-200 mt-1">Financial Tracking System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-white text-rose-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-white text-rose-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - only for signup */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Enter your full name"
                  required={mode === 'signup'}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder={mode === 'signup' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role selection - only for signup */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                  Your Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {roleOptions.map(opt => {
                    const isTaken = takenPositions.includes(opt.value);
                    return (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={isTaken}
                        className={isTaken ? 'text-gray-400' : ''}
                      >
                        {opt.label}{isTaken ? ' (Position Taken)' : ''} - {opt.description}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Select your chapter position. This determines your access level.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full rounded-lg bg-rose-700 px-4 py-3 font-semibold text-white shadow-sm hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-rose-200 text-sm mt-6">
          American Business Women&apos;s Association
        </p>
      </div>
    </div>
  );
}
