import { Mail, Lock, Building2, IndianRupee, BarChart3, LayoutDashboard, Receipt, PieChart, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FlatLedgerIcon, FLAT_LEDGER_ICON_SIZES } from '../components/ui/FlatLedgerIcon';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { AlertMessages } from '../lib/alertMessages';

type LoginFormData = {
  usernameOrEmail: string;
  password: string;
};

const featureDefs = [
  { icon: LayoutDashboard, key: 'dashboard' },
  { icon: IndianRupee, key: 'billing' },
  { icon: Receipt, key: 'payments' },
  { icon: BarChart3, key: 'reports' },
  { icon: PieChart, key: 'expenses' },
  { icon: Building2, key: 'flats' },
] as const;

export default function Login() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current); };
  }, []);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      showToast(AlertMessages.error.sessionExpired, 'warning');
      searchParams.delete('reason');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [searchParams, showToast, navigate]);

  if (isAuthenticated) return null;

  const loginSchema = z.object({
    usernameOrEmail: z.string().min(1, t('auth.login.validation.usernameRequired')),
    password: z.string().min(6, t('auth.login.validation.passwordMin')),
  });

  const features = featureDefs.map(feature => ({
    icon: feature.icon,
    title: t(`auth.login.features.${feature.key}.title`),
    desc: t(`auth.login.features.${feature.key}.desc`),
  }));

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const authResponse = await login(data);
      showToast(AlertMessages.success.loginSuccess, 'success');
      // Redirect to appropriate page based on user state
      if (authResponse.forcePasswordChange) {
        navigate('/change-password');
      } else {
        // For now, always navigate to dashboard and let it redirect to setup if needed
        // This ensures unified redirect logic in Dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error?.details?.status === 429) {
        setIsRateLimited(true);
        rateLimitTimerRef.current = setTimeout(() => setIsRateLimited(false), 60_000);
        return;
      }
      const errorData = error?.response?.data;
      if (errorData) {
        showErrorToast({
          ok: false,
          message: errorData.message || AlertMessages.error.invalidCredentials,
          code: errorData.code,
          fieldErrors: errorData.errors?.reduce((acc: any, err: any) => { acc[err.field] = err.messages; return acc; }, {}),
          traceId: errorData.traceId,
        });
      } else {
        showToast(AlertMessages.error.invalidCredentials, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex-col p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-[26rem] h-[26rem] bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-4 mb-12">
          <FlatLedgerIcon size={FLAT_LEDGER_ICON_SIZES.authHero} className="rounded-xl shadow-lg" />
          <div className="flex flex-col leading-none gap-1.5">
            <span className="text-[24px] tracking-tight">
              <span className="text-white font-bold">Flat</span><span className="font-black bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">Ledger</span>
            </span>
            <span className="text-[11px] tracking-[0.07em] text-emerald-100/85 font-semibold">Society Maintenance Simplified</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
            <span className="text-emerald-100 text-xs font-medium">30-day free trial · No credit card required</span>
          </div>
          <h2 className="text-[2.6rem] font-bold text-white leading-tight mb-3">
            Everything your<br />society needs.
          </h2>
          <p className="text-emerald-100/90 text-base leading-relaxed max-w-sm">
            One place to manage billing, payments, expenses and reports — no Excel, no WhatsApp.
          </p>
        </div>

        {/* Feature grid — 2 columns */}
        <div className="relative z-10 grid grid-cols-2 gap-x-6 gap-y-5 mt-auto">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white mt-0.5">
                <f.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{f.title}</p>
                <p className="text-emerald-100/80 text-xs leading-snug mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/20 flex items-center gap-6 text-xs text-emerald-100/70">
          <span>🏢 50+ societies</span>
          <span>🔒 Encrypted & secure</span>
          <span>📤 Export anytime</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-[48%] h-full flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mb-8"
          >
            ← {t('auth.login.backToHome')}
          </Link>

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-1">
              <FlatLedgerIcon size={FLAT_LEDGER_ICON_SIZES.authCompact} className="rounded-lg shadow-sm lg:hidden" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.login.title')}</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('auth.login.subtitle')}</p>
          </div>

          {/* Form */}
          <div className="card" data-testid="login-form">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={t('auth.login.usernameLabel')}
                placeholder={t('auth.login.usernamePlaceholder')}
                icon={<Mail className="w-4 h-4" />}
                error={errors.usernameOrEmail?.message}
                data-testid="input-email"
                {...register('usernameOrEmail')}
              />

              <div>
                <Input
                  label={t('auth.login.passwordLabel')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  icon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                      aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  data-testid="input-password"
                  {...register('password')}
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary dark:text-primary-400 hover:underline font-medium"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
              </div>

              {isRateLimited && (
                <p className="text-xs text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2 px-3">
                  {t('auth.login.rateLimit')}
                </p>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading || isRateLimited}
                className="w-full"
                size="lg"
                data-testid="login-submit-btn"
              >
                {t('auth.login.submit')}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('auth.login.noAccount')}{' '}
              <Link to="/signup" className="text-primary dark:text-primary-400 hover:underline font-semibold">
                {t('auth.login.startFreeTrial')}
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
            {t('auth.login.footerPrefix')}{' '}
            <Link to="/terms" className="hover:underline text-slate-500 dark:text-slate-400">{t('auth.login.terms')}</Link>
            {' '}{t('auth.login.and')}{' '}
            <Link to="/privacy" className="hover:underline text-slate-500 dark:text-slate-400">{t('auth.login.privacyPolicy')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
