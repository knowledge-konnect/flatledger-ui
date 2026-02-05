import { Building2, User, Mail, Lock, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { handleApiError } from '../api/client';
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
    } catch (error: any) {
      const apiError = handleApiError(error);
      showToast(AlertMessages.error.signupFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl animate-slide-in-up">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/25 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Set up your society management in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="card shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Details Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                Account Details
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-5 h-5" />}
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="mt-5">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 6 characters"
                  icon={<Lock className="w-5 h-5" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200 dark:border-neutral-700" />

            {/* Society Details Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                Society Information
              </h3>
              <div className="space-y-5">
                <Input
                  label="Society Name"
                  placeholder="e.g., Greenwoods Apartments"
                  icon={<Building2 className="w-5 h-5" />}
                  error={errors.societyName?.message}
                  {...register('societyName')}
                />

                <div>
                  <label className="label">
                    Society Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                    <textarea
                      placeholder="Enter full society address"
                      rows={3}
                      className={cn(
                        'w-full pl-12 pr-4 py-3 rounded-xl',
                        'text-base',
                        'bg-white dark:bg-neutral-800',
                        'text-neutral-900 dark:text-white',
                        'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                        'border-2 border-neutral-200 dark:border-neutral-700',
                        'focus:border-primary-500 dark:focus:border-primary-500',
                        'focus:ring-4 focus:ring-primary-500/10',
                        'transition-all duration-200',
                        'outline-none resize-none',
                        errors.societyAddress && 'border-error-500 focus:border-error-500 focus:ring-error-500/10'
                      )}
                      {...register('societyAddress')}
                    />
                  </div>
                  {errors.societyAddress && (
                    <p className="mt-2 text-sm text-error-600 dark:text-error-400 font-medium animate-slide-in-up">
                      {errors.societyAddress.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full mt-8"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
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
