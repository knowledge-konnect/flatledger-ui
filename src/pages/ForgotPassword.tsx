import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { AlertMessages } from '../lib/alertMessages';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const forgotFormSchema = (t: (key: string) => string) => z.object({
  email: z
    .string()
    .min(1, t('auth.forgot.validation.emailRequired'))
    .email(t('auth.forgot.validation.invalidEmail'))
    .toLowerCase()
    .trim(),
  mobile: z
    .string()
    .min(1, t('auth.forgot.validation.mobileRequired'))
    .regex(/^[0-9]{10}$/, t('auth.forgot.validation.invalidMobile')),
});
type ForgotForm = z.infer<ReturnType<typeof forgotFormSchema>>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const forgotPasswordMutation = useForgotPassword();

  const form = useForm<ForgotForm>({
    resolver: zodResolver(forgotFormSchema(t)),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      const result = await forgotPasswordMutation.mutateAsync({ email: data.email, mobile: data.mobile });
      if (result.resetToken) {
        // Navigate directly to the reset page with the token pre-filled.
        navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
      } else {
        // Credentials did not match — show generic message to avoid user enumeration.
        setStep('done');
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        showToast(t('auth.forgot.validation.tooManyAttempts'), 'error');
      } else {
        showToast(AlertMessages.error.somethingWentWrong, 'error');
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
              <Input
                label={t('auth.forgot.emailLabel')}
                type="email"
                placeholder={t('auth.forgot.emailPlaceholder')}
                icon={<Mail className="w-4 h-4" />}
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
              <Input
                label={t('auth.forgot.mobileLabel')}
                type="tel"
                placeholder={t('auth.forgot.mobilePlaceholder')}
                icon={<Phone className="w-4 h-4" />}
                error={form.formState.errors.mobile?.message}
                {...form.register('mobile')}
              />
              <Button type="submit" className="w-full" isLoading={forgotPasswordMutation.isPending}>
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
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('auth.forgot.noMatchBody')}
              </p>
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep('form')}>
                {t('auth.forgot.tryAgain')}
              </Button>
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
