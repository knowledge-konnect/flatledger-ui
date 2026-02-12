import { Building2, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      await login(data);
      showToast(AlertMessages.success.loginSuccess, 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-form animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2"
              size="lg"
              data-testid="login-submit-btn"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
