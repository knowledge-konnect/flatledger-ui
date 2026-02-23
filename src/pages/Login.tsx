import { Building2, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { AlertMessages } from '../lib/alertMessages';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Show session expired message if redirected from protected route
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      showToast('Your session has expired. Please log in again.', 'warning');
      // Clean up URL to remove the reason parameter
      searchParams.delete('reason');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [searchParams, showToast, navigate]);

  // If already authenticated, don't render the form at all
  // This prevents flickering when Router redirects
  if (isAuthenticated) {
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // 1. Call auth.login(response.data)
      const authResponse = await login(data);
      showToast(AlertMessages.success.loginSuccess, 'success');
      
      // 2. If response.requiresPasswordChange, navigate to '/change-password', else navigate to '/dashboard'
      if (authResponse.forcePasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
      // Keep isLoading true to prevent flickering until redirect completes
    } catch (error: any) {
      // 4. Use showErrorToast for API validation errors
      const errorData = error?.response?.data;
      if (errorData) {
        showErrorToast({
          ok: false,
          message: errorData.message || AlertMessages.error.invalidCredentials,
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
        showToast(AlertMessages.error.invalidCredentials, 'error');
      }
      // 3. Disable login button while submitting (by setting isLoading to false on error)
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-form animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2563EB] rounded-xl mb-4 shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Sign in to your society dashboard
          </p>
        </div>

        {/* Form Card */}
        <div className="card" data-testid="login-form">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email or Username"
              placeholder="your@email.com or username"
              icon={<Mail className="w-4 h-4" />}
              error={errors.usernameOrEmail?.message}
              data-testid="input-email"
              {...register('usernameOrEmail')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              data-testid="input-password"
              {...register('password')}
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E2E8F0] dark:border-[#1E293B] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] dark:hover:text-[#2563EB] font-medium"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full mt-2"
              size="lg"
              data-testid="login-submit-btn"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] dark:hover:text-[#2563EB] font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
          By signing in, you agree to our{' '}
          <a href="#" className="text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] dark:hover:text-[#2563EB]">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] dark:hover:text-[#2563EB]">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
