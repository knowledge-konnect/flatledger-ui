import { useState } from 'react';
import { Building2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '../hooks/api/useAuth';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data.email);
      setSubmitted(true);
      showToast('Password reset link sent to your email', 'success');
    } catch (error: unknown) {
      const errorData = (error as any)?.response?.data;
      if (errorData) {
        showErrorToast({
          ok: false,
          message: errorData.message || 'Failed to send reset link',
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
        showToast('Failed to send reset link', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-form animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {submitted
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Card */}
        <div className="card" data-testid="forgot-password-form">
          {submitted ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Email Sent!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.location.href = '/login'}
                data-testid="back-to-login-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                data-testid="input-email"
                {...register('email')}
              />

              <Button
                type="submit"
                isLoading={forgotPasswordMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="send-reset-btn"
              >
                Send Reset Link
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => window.location.href = '/login'}
                data-testid="back-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
