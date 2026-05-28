import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPassword } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { setInMemoryAccessToken } from '../api/client';
import { authApi } from '../api/authApi';
import { calculatePasswordStrength } from '../lib/validation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const passwordFormSchema = (t: (key: string) => string) => z
  .object({
    newPassword: z
      .string()
      .min(6, t('auth.forgot.validation.passwordMin'))
      .max(128, t('auth.forgot.validation.passwordMax'))
      .regex(/[A-Z]/, t('auth.forgot.validation.passwordUpper'))
      .regex(/[a-z]/, t('auth.forgot.validation.passwordLower'))
      .regex(/[0-9]/, t('auth.forgot.validation.passwordNumber')),
    confirmPassword: z.string().min(1, t('auth.forgot.validation.confirmRequired')),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: t('auth.forgot.validation.passwordsNoMatch'),
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<ReturnType<typeof passwordFormSchema>>;

const SS_TOKEN_KEY = '__sl_at';
const SS_USER_KEY = '__sl_u';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const token = searchParams.get('token')?.trim() ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const resetMutation = useResetPassword();

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema(t)),
  });

  const watchPassword = passwordForm.watch('newPassword');
  const passwordStrength = watchPassword ? calculatePasswordStrength(watchPassword) : null;

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const onSubmit = async (data: PasswordForm) => {
    try {
      const result = await resetMutation.mutateAsync({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (result?.accessToken) {
        setInMemoryAccessToken(result.accessToken);
        sessionStorage.setItem(SS_TOKEN_KEY, result.accessToken);
        try {
          const user = await authApi.getMe();
          sessionStorage.setItem(SS_USER_KEY, JSON.stringify(user));
        } catch {
          // Non-critical
        }
      }

      setDone(true);
      setTimeout(() => {
        window.location.href = result?.accessToken ? '/dashboard' : '/login';
      }, 1500);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      const status = err?.response?.status;
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors?.token?.[0]) {
        passwordForm.setError('newPassword', { message: fieldErrors.token[0] });
      } else if (status === 429) {
        showToast(t('auth.forgot.validation.tooManyAttempts'), 'error');
      } else {
        showToast(err?.response?.data?.message || t('auth.forgot.validation.resetFailed'), 'error');
      }
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4 shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
            {done ? t('auth.forgot.header.updatedTitle') : t('auth.forgot.header.setTitle')}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {done ? t('auth.forgot.header.successDesc') : t('auth.reset.tokenStepDesc')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-300">{t('auth.forgot.successBody')}</p>
            </div>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('auth.forgot.newPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.forgot.newPasswordPlaceholder')}
                    error={passwordForm.formState.errors.newPassword?.message}
                    {...passwordForm.register('newPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {t('auth.reset.strengthLabel')}: {passwordStrength.label}
                  </p>
                )}
              </div>
              <Input
                label={t('auth.forgot.confirmPassword')}
                type="password"
                placeholder={t('auth.forgot.confirmPasswordPlaceholder')}
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              <Button type="submit" className="w-full" isLoading={resetMutation.isPending}>
                {t('auth.forgot.resetPassword')}
              </Button>
              <Link
                to="/forgot-password"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.forgot.backToLogin')}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
