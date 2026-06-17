import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const forgotFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
});
type ForgotForm = z.infer<typeof forgotFormSchema>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const form = useForm<ForgotForm>({
    resolver: zodResolver(forgotFormSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsRateLimited(false);
    try {
      await forgotPasswordMutation.mutateAsync({ email: data.email });
      // Always show success — API returns 200 even if email doesn't exist
      setStep('done');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        setIsRateLimited(true);
      }
      // For all other errors (including 400), still show "done" to prevent email enumeration
      // Only 429 warrants a visible error
      if (status !== 429) {
        setStep('done');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4 shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
            {step === 'form' ? t('auth.forgot.header.resetTitle') : t('auth.forgot.header.sentTitle')}
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {step === 'form'
              ? t('auth.forgot.header.formStepDesc')
              : t('auth.forgot.header.sentStepDesc')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          {step === 'form' ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Rate limit banner */}
              {isRateLimited && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Too many attempts. Please try again in a minute.
                  </p>
                </div>
              )}

              <Input
                label={t('auth.forgot.emailLabel')}
                type="email"
                placeholder={t('auth.forgot.emailPlaceholder')}
                icon={<Mail className="w-4 h-4" />}
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
              <Button
                type="submit"
                className="w-full"
                isLoading={forgotPasswordMutation.isPending}
                disabled={forgotPasswordMutation.isPending || isRateLimited}
              >
                {t('auth.forgot.verifyAndContinue')}
              </Button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.forgot.backToLogin')}
              </Link>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Check your inbox. If this email is registered, you'll receive a reset link shortly.
              </p>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.forgot.backToLogin')}
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          {t('auth.forgot.rememberPassword')}{' '}
          <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
            {t('auth.forgot.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
