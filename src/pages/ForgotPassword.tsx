import { useState } from 'react';
import { Building2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '../hooks/api/useAuth';
import { useToast } from '../components/ui/Toast';
import Input from '../components/ui/Input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();
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
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to send reset link', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-in-up">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/25 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {submitted
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-xl">
          {submitted ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900/30 dark:to-success-800/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-10 h-10 text-success-600 dark:text-success-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Email Sent!
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/login'}
                className="btn btn-secondary w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="w-5 h-5" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="btn btn-primary btn-lg w-full"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="btn btn-ghost w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
