import { Building2, User, Mail, Lock, MapPin } from 'lucide-react';
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
import { cn } from '../lib/utils';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  societyName: z.string().min(2, 'Society name is required'),
  societyAddress: z.string().min(5, 'Please enter a valid address'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        societyName: data.societyName,
        societyAddress: data.societyAddress,
      });
      showToast(AlertMessages.success.signupSuccess, 'success');
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorData = (error as any)?.response?.data;
        if (errorData) {
          showErrorToast({
            ok: false,
            message: errorData.message || AlertMessages.error.signupFailed,
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
          showToast(error.message || AlertMessages.error.signupFailed, 'error');
        }
      } else {
        showToast(AlertMessages.error.signupFailed, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[560px] animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set up your society management in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="card" data-testid="signup-form">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Account Details Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Account Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  data-testid="input-name"
                  {...register('name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  data-testid="input-email"
                  {...register('email')}
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 6 characters"
                  icon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  data-testid="input-password"
                  {...register('password')}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-800" />

            {/* Society Details Section */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Society Information
              </h3>
              <div className="space-y-4">
                <Input
                  label="Society Name"
                  placeholder="e.g., Greenwoods Apartments"
                  icon={<Building2 className="w-4 h-4" />}
                  error={errors.societyName?.message}
                  data-testid="input-society-name"
                  {...register('societyName')}
                />

                <div className="form-group">
                  <label className="label">Society Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <textarea
                      placeholder="Enter full society address"
                      rows={3}
                      className={cn(
                        'input pl-10 min-h-[80px] py-2.5 resize-none',
                        errors.societyAddress && 'input-error'
                      )}
                      data-testid="input-society-address"
                      {...register('societyAddress')}
                    />
                  </div>
                  {errors.societyAddress && (
                    <p className="error-text">{errors.societyAddress.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2"
              size="lg"
              data-testid="signup-submit-btn"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
