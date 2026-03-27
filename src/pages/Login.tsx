import { Mail, Lock, Building2, IndianRupee, BarChart3, LayoutDashboard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FlatLedgerIcon } from '../components/ui/FlatLedgerIcon';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { AlertMessages } from '../lib/alertMessages';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the rate-limit timer on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
    };
  }, []);

  // Show session expired message if redirected from protected route
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      showToast('Your session has expired. Please log in again.', 'warning');
      // Clean up URL to remove the reason parameter
      searchParams.delete('reason');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [searchParams, showToast, navigate]);

  // If already authenticated, don't render the form at all
  // This prevents flickering when Router redirects
  if (isAuthenticated) {
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // 1. Call auth.login(response.data)
      const authResponse = await login(data);
      showToast(AlertMessages.success.loginSuccess, 'success');
      
      // 2. If response.requiresPasswordChange, navigate to '/change-password', else navigate to '/dashboard'
      if (authResponse.forcePasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
      // Keep isLoading true to prevent flickering until redirect completes
    } catch (error: any) {
      // Handle 429 Too Many Requests — disable submit for 60 seconds
      if (error?.details?.status === 429) {
        setIsRateLimited(true);
        rateLimitTimerRef.current = setTimeout(() => setIsRateLimited(false), 60_000);
        // The global interceptor already shows the toast — no duplicate needed
        return;
      }

      // 4. Use showErrorToast for API validation errors
      const errorData = error?.response?.data;
      if (errorData) {
        showErrorToast({
          ok: false,
          message: errorData.message || AlertMessages.error.invalidCredentials,
          code: errorData.code,
          fieldErrors: errorData.errors?.reduce(
            (acc: any, err: any) => {
              acc[err.field] = err.messages;
              return acc;
            },
            {}
          ),
          traceId: errorData.traceId,
        });
      } else {
        showToast(AlertMessages.error.invalidCredentials, 'error');
      }
    } finally {
      // Always re-enable the button (success path keeps it true only if navigate unmounts)
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <LayoutDashboard className="w-5 h-5" />, title: 'Live KPI Dashboard', desc: 'Collection rate, fund balance and pending dues — all on one screen, always current.' },
    { icon: <Building2 className="w-5 h-5" />, title: 'Flat & Resident Management', desc: 'Manage flats, owners and tenants — import from your existing Excel sheet in minutes.' },
    { icon: <IndianRupee className="w-5 h-5" />, title: 'Maintenance Billing', desc: 'One click generates bills for every flat and records cash, UPI, cheque or bank transfers.' },
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Built-in Reports', desc: 'Billing summary, outstanding dues, income vs expense and expenses by category.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex">

      {/* ── Left panel (decorative, desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-28 -left-28 w-80 h-80 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-36 -right-20 w-[28rem] h-[28rem] bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <FlatLedgerIcon size={40} className="rounded-xl shadow-lg" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Flat</span><span className="text-emerald-300">Ledger</span>
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-3">
            Everything your<br />society needs.
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed">
            One place to manage billing, payments,<br />expenses and reports — no Excel, no WhatsApp.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-5">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-emerald-100 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* ── Right panel (form) ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-form animate-fade-in">

          {/* Back to home */}
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              <span>&#8592;</span> Back to home
            </Link>
          </div>

          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex mb-4">
              <FlatLedgerIcon size={48} className="rounded-xl shadow-md" />
            </div>
            <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Sign in to manage your society
            </p>
          </div>

          {/* Form Card */}
          <div className="card" data-testid="login-form">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email or Username"
                placeholder="your@email.com or username"
                icon={<Mail className="w-4 h-4" />}
                error={errors.usernameOrEmail?.message}
                data-testid="input-email"
                {...register('usernameOrEmail')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                data-testid="input-password"
                {...register('password')}
              />

              <div className="flex items-center justify-end text-sm pt-1">
                <a
                  href="/forgot-password"
                  className="text-primary dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary font-medium"
                >
                  Forgot password?
                </a>
              </div>

              {isRateLimited && (
                <p className="text-sm text-error-600 dark:text-error-400 text-center">
                  Too many login attempts. Please wait 1 minute.
                </p>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading || isRateLimited}
                className="w-full mt-2"
                size="lg"
                data-testid="login-submit-btn"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-primary dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
