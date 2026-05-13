import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckEmail, useResetPasswordDirect } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { setInMemoryAccessToken } from '../api/client';
import { authApi } from '../api/authApi';
import { emailSchema, passwordSchema, calculatePasswordStrength } from '../lib/validation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// ── Step 1 schema ────────────────────────────────────────────────────────────
const emailFormSchema = z.object({
  email: emailSchema,
});
type EmailForm = z.infer<typeof emailFormSchema>;

// ── Step 2 schema ────────────────────────────────────────────────────────────
const passwordFormSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordFormSchema>;

const SS_TOKEN_KEY = '__sl_at';
const SS_USER_KEY  = '__sl_u';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const checkEmailMutation      = useCheckEmail();
  const resetPasswordMutation   = useResetPasswordDirect();

  // ── Step 1 form ─────────────────────────────────────────────────────────────
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailFormSchema),
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
          message: 'No account found with this email address.',
        });
      } else if (status === 429) {
        showToast('Too many attempts. Please wait a minute and try again.', 'error');
      } else {
        showToast('Something went wrong. Please try again.', 'error');
      }
    }
  };

  // ── Step 2 form ─────────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema),
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
        showToast('Too many attempts. Please wait a minute and try again.', 'error');
      } else {
        showToast(message || 'Failed to reset password. Please try again.', 'error');
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
            {step === 'email'    && 'Reset Password'}
            {step === 'password' && 'Set New Password'}
            {step === 'success'  && 'Password Updated'}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {step === 'email'    && 'Enter your email address to continue'}
            {step === 'password' && `Setting new password for ${verifiedEmail}`}
            {step === 'success'  && 'Redirecting you now…'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
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
                Continue
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
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
                      {passwordStrength.label.replace('-', ' ')}
                    </span>
                  </div>
                )}

                {/* Requirements */}
                <div className="mt-3 space-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {[
                    [(watchPassword?.length ?? 0) >= 6,        '6–128 characters'],
                    [/[A-Z]/.test(watchPassword ?? ''),         'One uppercase letter'],
                    [/[a-z]/.test(watchPassword ?? ''),         'One lowercase letter'],
                    [/[0-9]/.test(watchPassword ?? ''),         'One number'],
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
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat password"
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
                Reset Password
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change Email
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
                  Password Updated
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Your password has been reset. Redirecting you now…
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
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
