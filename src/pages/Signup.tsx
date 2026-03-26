import { Building2, User, Mail, Lock, MapPin, CheckCircle2, Users, Settings2, FileDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordSchema } from '../lib/validation';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FlatLedgerIcon } from '../components/ui/FlatLedgerIcon';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { AlertMessages } from '../lib/alertMessages';
import { cn } from '../lib/utils';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  societyName: z.string().min(2, 'Society name is required'),
  societyAddress: z.string().min(5, 'Please enter a valid address'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, don't render the form at all
  // This prevents flickering when Router redirects
  if (isAuthenticated) {
    return null;
  }


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // 1. Call register and get auth response
      const authResponse = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        societyName: data.societyName,
        societyAddress: data.societyAddress,
      });
      showToast(AlertMessages.success.signupSuccess, 'success');
      
      // 2. If backend returns an accessToken, navigate to /dashboard, else navigate to /login
      if (authResponse?.accessToken) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
      // Keep isLoading true to prevent flickering until redirect completes
    } catch (error: unknown) {
      // 4. Handle validation errors using showErrorToast
      if (error instanceof Error) {
        const errorData = (error as any)?.response?.data;
        if (errorData) {
          showErrorToast({
            ok: false,
            message: errorData.message || AlertMessages.error.signupFailed,
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
          showToast(error.message || AlertMessages.error.signupFailed, 'error');
        }
      } else {
        showToast(AlertMessages.error.signupFailed, 'error');
      }
    } finally {
      // Always re-enable the button (success path keeps it true only if navigate unmounts)
      setIsLoading(false);
    }
  };

  const perks = [
    { icon: <Users className="w-5 h-5" />, title: 'Role-based team access', desc: 'Assign Admin, Treasurer, Member or Viewer roles to your team.' },
    { icon: <Settings2 className="w-5 h-5" />, title: 'Society & maintenance config', desc: 'Set monthly charges, due dates, late fees and grace periods.' },
    { icon: <FileDown className="w-5 h-5" />, title: 'CSV export for all data', desc: 'Export flats, payments, expenses and reports anytime.' },
  ];

  const included = [
    'Unlimited flats & residents',
    'Monthly billing generation',
    'Live KPI dashboard & 6 reports',
    'Defaulter & outstanding tracking',
    'Expense tracking by category',
    'Role-based team access',
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] flex">

      {/* ── Left panel (decorative, desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex-col justify-between p-10 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-28 -left-28 w-80 h-80 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-36 -right-20 w-[28rem] h-[28rem] bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <FlatLedgerIcon size={40} className="rounded-xl shadow-lg" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Flat</span><span className="text-emerald-300">Ledger</span>
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-2">
            Start managing<br />smarter today.
          </h2>
          <p className="text-emerald-100 text-base leading-relaxed">
            Join hundreds of societies already running on FlatLedger.
          </p>
        </div>

        {/* What's included */}
        <div className="relative z-10">
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-4">What's included</p>
          <ul className="space-y-3">
            {included.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Perks */}
        <div className="relative z-10 space-y-4">
          {perks.map((p, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                {p.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{p.title}</p>
                <p className="text-emerald-100 text-sm">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="w-full lg:w-[55%] h-full flex flex-col items-center justify-center px-6 py-4 overflow-y-auto scrollbar-hide">
        <div className="w-full max-w-[560px] animate-fade-in">

          {/* Brand Header */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlatLedgerIcon size={32} className="rounded-lg shadow-md" />
            <div className="text-left">
              <h1 className="text-xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-tight">Create your account</h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Set up your society management in minutes</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="card" data-testid="signup-form">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

              {/* Account Details */}
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  data-testid="input-name"
                  {...register('name')}
                />
                <Input
                  label="Email Address"
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

              <div className="border-t border-slate-200 dark:border-slate-800" />

              {/* Society Details */}
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
                    placeholder="Enter full society address"
                    rows={2}
                    className={cn(
                      'input pl-10 min-h-[60px] py-2 resize-none',
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
                Create Account
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
              </p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-primary dark:text-primary-500 hover:underline">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary dark:text-primary-500 hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
