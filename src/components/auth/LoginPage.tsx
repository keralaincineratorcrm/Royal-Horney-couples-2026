import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { useAuth, formatSupabaseAuthError } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

type AuthMode = 'login' | 'signup' | 'forgot_password';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword, isSupabaseConnected } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    clearMessages();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!isSupabaseConnected) {
      setErrorMessage(
        'Authentication service is not configured correctly. Please contact the administrator.'
      );
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email) {
          setErrorMessage('Please enter your email address.');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setErrorMessage('Please enter your password.');
          setIsLoading(false);
          return;
        }

        const res = await signIn(email, password);
        if (res.error) {
          setErrorMessage(res.error);
        }
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        if (!email || !email.includes('@')) {
          setErrorMessage('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        const res = await signUp({
          email,
          password,
          name,
          phone,
        });

        if (res.error) {
          if (res.error.toLowerCase().includes('confirm your email')) {
            setSuccessMessage(res.error);
          } else {
            setErrorMessage(res.error);
          }
        }
      } else if (mode === 'forgot_password') {
        if (!email || !email.includes('@')) {
          setErrorMessage('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }

        const res = await resetPassword(email);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage(
            'Password reset email sent! Please check your inbox for instructions to reset your password.'
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(formatSupabaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans select-none">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="flex justify-center mb-4">
          <BrandLogo light={true} size="lg" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Kerala Incinerator CRM
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Sales & Daily Activity Management Portal
        </p>

        {/* Supabase Connection Status Tag */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
          <span className="text-slate-400 font-medium">
            {isSupabaseConnected
              ? 'Supabase Auth: Connected'
              : 'Authentication Service Not Configured'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl text-slate-200">
          {/* Mode Switch Tabs (Login / Sign Up) */}
          {mode !== 'forgot_password' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/60 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('signup')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Forgot Password Header */}
          {mode === 'forgot_password' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] hover:text-sky-300 font-medium mb-3 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <KeyRound className="w-5 h-5 text-[#38BDF8]" />
                <h3>Reset Password</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered email address. We'll send you a link to reset your credentials.
              </p>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Your Full Name"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9.5 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@keralaincinerator.com"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9.5 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Phone & Role (Sign Up only) */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98460 00000"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9.5 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assigned CRM Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#38BDF8]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="w-full bg-slate-950/80 border border-slate-700/80 text-white rounded-xl pl-9.5 pr-3 py-2.5 text-xs flex items-center justify-between">
                      <span className="font-medium text-slate-200">
                        Staff / Sales Executive (Assigned Leads & CRM Modules)
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-[#38BDF8] px-2 py-0.5 rounded-md border border-blue-500/30">
                        Default
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                    New accounts default to Staff (Sales Executive). The first account on a fresh database or accounts promoted in Supabase are assigned Owner access.
                  </p>
                </div>
              </>
            )}

            {/* Password (Login and Sign Up) */}
            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot_password')}
                      className="text-[11px] text-[#38BDF8] hover:text-sky-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9.5 pr-10 py-2.5 text-xs focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9.5 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending...'}</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <span>Create CRM Account</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <Mail className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Aimury, Perumbavoor, Ernakulam, Kerala 683544</p>
          <p className="mt-1 font-mono text-[11px] text-slate-600">
            Official Manufacturing & Sales Enterprise Portal
          </p>
        </div>
      </div>
    </div>
  );
};
