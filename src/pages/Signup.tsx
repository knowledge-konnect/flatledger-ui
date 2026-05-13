import {
  Building2, User, Mail, Lock, MapPin, CheckCircle2,
  Users, IndianRupee, BarChart3, Receipt, Zap, PieChart,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordSchema } from '../lib/validation';
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FlatLedgerIcon } from '../components/ui/FlatLedgerIcon';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { AlertMessages } from '../lib/alertMessages';
import { cn } from '../lib/utils';
import { usePlans } from '../hooks/usePlans';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  societyName: z.string().min(2, 'Society name is required'),
  societyAddress: z.string().min(5, 'Please enter a valid address'),
});

type SignupFormData = z.infer<typeof signupSchema>;

const included = [
  { icon: IndianRupee, label: 'One-click monthly billing' },
  { icon: Receipt,     label: 'Real-time payment tracking' },
  { icon: Zap,         label: 'Live KPI dashboard' },
  { icon: BarChart3,   label: 'Income & expense reports' },
  { icon: PieChart,    label: 'Defaulter tracking' },
  { icon: Building2,   label: 'Unlimited flats & residents' },
  { icon: Users,       label: 'Role-based team access' },
  { icon: Building2,   label: 'Society & maintenance config' },
];

export default function Signup() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { plans } = usePlans();

  // Resolve the plan name from the ?plan= query param if present
  const planIdFromUrl = searchParams.get('plan');
  const selectedPlan = planIdFromUrl ? plans.find(p => p.id === planIdFromUrl) : null;

  if (isAuthenticated) return null;

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const authResponse = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        societyName: data.societyName,
        societyAddress: data.societyAddress,
      });
      showToast(AlertMessages.success.signupSuccess, 'success');
      // New users should go directly to the setup flow to avoid flashing the dashboard
      navigate(authResponse?.accessToken ? '/setup' : '/login');
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorData = (error as any)?.response?.data;
        if (errorData) {
          showErrorToast({
            ok: false,
            message: errorData.message || AlertMessages.error.signupFailed,
            code: errorData.code,
            fieldErrors: errorData.errors?.reduce((acc: any, err: any) => { acc[err.field] = err.messages; return acc; }, {}),
            traceId: errorData.traceId,
          });
        } else {
          showToast(error.message || AlertMessages.error.signupFailed, 'error');
        }
      } else {
        showToast(AlertMessages.error.signupFailed, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[42%] h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-[26rem] h-[26rem] bg-white/10 rounded-full pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <FlatLedgerIcon size={36} className="rounded-xl shadow-lg" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Flat</span><span className="text-emerald-300">Ledger</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
            <span className="text-emerald-100 text-xs font-medium">30-day free trial · No credit card</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Replace Excel with<br />one simple app.
          </h2>
          <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
            Join 50+ housing societies already managing billing, payments and reports on FlatLedger.
          </p>

          {/* Feature checklist */}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {included.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Trust bar */}
        <div className="relative z-10 pt-5 border-t border-white/20 flex items-center gap-5 text-xs text-emerald-100/60">
          <span>🔒 Encrypted & secure</span>
          <span>📤 Export anytime</span>
          <span>✕ Cancel anytime</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-[58%] h-full flex flex-col items-center justify-center px-12">
        <div className="w-full max-w-[560px] animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <FlatLedgerIcon size={30} className="rounded-lg shadow-sm lg:hidden" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedPlan
                  ? <><span className="text-emerald-600 dark:text-emerald-400 font-medium">{selectedPlan.name} plan</span> · Free for 30 days</>
                  : 'Free for 30 days, no credit card needed'
                }
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              ← Back
            </Link>
          </div>

          {/* Form */}
          <div className="card" data-testid="signup-form">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  data-testid="input-name"
                  {...register('name')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  data-testid="input-email"
                  {...register('email')}
                />
              </div>

              <Input
                label="Password"
                type="password"
                placeholder="Min. 6 characters"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                data-testid="input-password"
                {...register('password')}
              />

              <div className="border-t border-slate-200 dark:border-slate-700" />

              <Input
                label="Society Name"
                placeholder="e.g., Greenwoods Apartments"
                icon={<Building2 className="w-4 h-4" />}
                error={errors.societyName?.message}
                data-testid="input-society-name"
                autoComplete="off"
                {...register('societyName')}
              />

              <div className="form-group">
                <label className="label">Society Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <textarea
                    placeholder="Enter full society address (building, street, city, state)"
                    rows={4}
                    className={cn(
                      'input pl-10 py-2.5 resize-none overflow-hidden min-h-[100px]',
                      errors.societyAddress && 'input-error'
                    )}
                    data-testid="input-society-address"
                    {...register('societyAddress')}
                  />
                </div>
                {errors.societyAddress && (
                  <p className="error-text">{errors.societyAddress.message}</p>
                )}
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full"
                size="lg"
                data-testid="signup-submit-btn"
              >
                Start Free Trial
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary dark:text-primary-400 hover:underline font-semibold">Sign in</Link>
            </p>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            By continuing you agree to our{' '}
            <Link to="/terms" className="hover:underline text-slate-500 dark:text-slate-400">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="hover:underline text-slate-500 dark:text-slate-400">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
