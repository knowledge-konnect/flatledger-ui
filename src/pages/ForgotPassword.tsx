import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckEmail, useResetPasswordDirect } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { setInMemoryAccessToken } from '../api/client';
import { authApi } from '../api/authApi';
import { calculatePasswordStrength } from '../lib/validation';
import { AlertMessages } from '../lib/alertMessages';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// ── Step 1 schema ────────────────────────────────────────────────────────────
const emailFormSchema = (t: (key: string) => string) => z.object({
  email: z
    .string()
    .min(1, t('auth.forgot.validation.emailRequired'))
    .email(t('auth.forgot.validation.invalidEmail'))
    .toLowerCase()
    .trim(),
});
type EmailForm = z.infer<ReturnType<typeof emailFormSchema>>;

// ── Step 2 schema ────────────────────────────────────────────────────────────
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

const strengthLabels = {
  weak: 'auth.forgot.strength.weak',
  fair: 'auth.forgot.strength.fair',
  good: 'auth.forgot.strength.good',
  strong: 'auth.forgot.strength.strong',
  'very-strong': 'auth.forgot.strength.veryStrong',
} as const;

const SS_TOKEN_KEY = '__sl_at';
const SS_USER_KEY  = '__sl_u';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const checkEmailMutation      = useCheckEmail();
  const resetPasswordMutation   = useResetPasswordDirect();

  // ── Step 1 form ─────────────────────────────────────────────────────────────
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailFormSchema(t)),
  });

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      await checkEmailMutation.mutateAsync(data.email);
      setVerifiedEmail(data.email);
      setStep('password');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        emailForm.setError('email', {
          message: t('auth.forgot.validation.accountNotFound'),
        });
      } else if (status === 429) {
        showToast(t('auth.forgot.validation.tooManyAttempts'), 'error');
      } else {
        showToast(AlertMessages.error.somethingWentWrong, 'error');
      }
    }
  };

  // ── Step 2 form ─────────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema(t)),
  });

  const watchPassword = passwordForm.watch('newPassword');
  const passwordStrength = watchPassword ? calculatePasswordStrength(watchPassword) : null;

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      const result = await resetPasswordMutation.mutateAsync({
        email: verifiedEmail,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      // Auto-login: store the returned access token
      if (result?.accessToken) {
        setInMemoryAccessToken(result.accessToken);
        sessionStorage.setItem(SS_TOKEN_KEY, result.accessToken);
        try {
          const user = await authApi.getMe();
          sessionStorage.setItem(SS_USER_KEY, JSON.stringify(user));
        } catch {
          // Non-critical — next page load will re-fetch
        }
      }

      setStep('success');
      setTimeout(() => {
        window.location.href = result?.accessToken ? '/dashboard' : '/login';
      }, 1500);
    } catch (error: any) {
      const status  = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 429) {
        showToast(t('auth.forgot.validation.tooManyAttempts'), 'error');
      } else {
        showToast(message || t('auth.forgot.validation.resetFailed'), 'error');
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4 shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
            {step === 'email'    && t('auth.forgot.header.resetTitle')}
            {step === 'password' && t('auth.forgot.header.setTitle')}
            {step === 'success'  && t('auth.forgot.header.updatedTitle')}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {step === 'email'    && t('auth.forgot.header.emailStepDesc')}
            {step === 'password' && t('auth.forgot.header.passwordStepDesc', { email: verifiedEmail })}
            {step === 'success'  && t('auth.forgot.header.successDesc')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
              <Input
                label={t('auth.forgot.emailLabel')}
                type="email"
                placeholder={t('auth.forgot.emailPlaceholder')}
                icon={<Mail className="w-4 h-4" />}
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />

              <Button
                type="submit"
                isLoading={checkEmailMutation.isPending}
                className="w-full"
                size="lg"
              >
                {t('auth.forgot.continue')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.forgot.backToLogin')}
              </Button>
            </form>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('auth.forgot.newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.forgot.newPasswordPlaceholder')}
                    className={`w-full px-4 py-2.5 pr-12 rounded-lg border-2 transition-all duration-200
                      bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                      ${passwordForm.formState.errors.newPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'}
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    {...passwordForm.register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}

                {/* Strength bar */}
                {watchPassword && passwordStrength && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300
                            ${level <= Math.ceil(passwordStrength.score / 1.4)
                              ? passwordStrength.label === 'weak'        ? 'bg-red-500'
                              : passwordStrength.label === 'fair'        ? 'bg-orange-500'
                              : passwordStrength.label === 'good'        ? 'bg-yellow-500'
                              : passwordStrength.label === 'strong'      ? 'bg-green-500'
                              : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium capitalize
                      ${passwordStrength.label === 'weak'        && 'text-red-600 dark:text-red-400'}
                      ${passwordStrength.label === 'fair'        && 'text-orange-600 dark:text-orange-400'}
                      ${passwordStrength.label === 'good'        && 'text-yellow-600 dark:text-yellow-400'}
                      ${passwordStrength.label === 'strong'      && 'text-green-600 dark:text-green-400'}
                      ${passwordStrength.label === 'very-strong' && 'text-emerald-600 dark:text-emerald-400'}
                    `}>
                      {t(strengthLabels[passwordStrength.label])}
                    </span>
                  </div>
                )}

                {/* Requirements */}
                <div className="mt-3 space-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {[
                    [(watchPassword?.length ?? 0) >= 6, t('auth.forgot.requirements.chars')],
                    [/[A-Z]/.test(watchPassword ?? ''), t('auth.forgot.requirements.uppercase')],
                    [/[a-z]/.test(watchPassword ?? ''), t('auth.forgot.requirements.lowercase')],
                    [/[0-9]/.test(watchPassword ?? ''), t('auth.forgot.requirements.number')],
                  ].map(([met, label]) => (
                    <div key={label as string} className="flex items-center gap-2">
                      <span className={met ? 'text-emerald-600' : 'text-slate-400'}>✓</span>
                      <span>{label as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('auth.forgot.confirmPassword')}
                </label>
                <input
                  type="password"
                  placeholder={t('auth.forgot.confirmPasswordPlaceholder')}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200
                    bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                    ${passwordForm.formState.errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'}
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                isLoading={resetPasswordMutation.isPending}
                className="w-full"
                size="lg"
              >
                {t('auth.forgot.resetPassword')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.forgot.changeEmail')}
              </Button>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-600/10 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
                  {t('auth.forgot.successTitle')}
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  {t('auth.forgot.successBody')}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            {t('auth.forgot.rememberPassword')}{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {t('auth.forgot.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
