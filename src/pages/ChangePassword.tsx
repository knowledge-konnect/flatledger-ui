import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Building2, Info } from 'lucide-react';
import Input from '../components/ui/Input';
import { useChangePassword } from '../hooks/useChangePassword';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { useAuth } from '../contexts/AuthProvider';
import { AlertMessages } from '../lib/alertMessages';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { mutate: changePassword, isPending } = useChangePassword();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    changePassword(formData, {
      onSuccess: async () => {
        showToast(AlertMessages.success.passwordChangeSuccess, 'success');
        await logout();
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        if (errorData) {
          showErrorToast({
            ok: false,
            message: errorData.message || AlertMessages.error.passwordChangeFailed,
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
          showToast(AlertMessages.error.passwordChangeFailed, 'error');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-in-up">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2563EB] rounded-2xl shadow-sm mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
            {user?.forcePasswordChange ? 'Set Your Password' : 'Change Password'}
          </h1>
          <p className="text-[#64748B] dark:text-[#94A3B8]">
            {user?.name && `Welcome, ${user.name}`}
          </p>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 max-w-sm mx-auto">
            {user?.forcePasswordChange
              ? 'Your admin created your account with a temporary password. Please set a new password to continue.'
              : 'You are required to change your password before accessing the dashboard.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="label">
                {user?.forcePasswordChange ? 'Temporary Password' : 'Current Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none" />
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  disabled={isPending}
                  className={`input pl-12 pr-12 ${errors.currentPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-2 text-sm text-[#DC2626] dark:text-[#EF4444] font-medium animate-slide-in-up">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none" />
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  disabled={isPending}
                  className={`input pl-12 pr-12 ${errors.newPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      new: !prev.new,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-[#DC2626] dark:text-[#EF4444] font-medium animate-slide-in-up">
                  {errors.newPassword}
                </p>
              )}
              <p className="mt-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                Must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none" />
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  disabled={isPending}
                  className={`input pl-12 pr-12 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-[#DC2626] dark:text-[#EF4444] font-medium animate-slide-in-up">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isPending} className="btn btn-primary btn-lg w-full mt-8">
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 border border-[#2563EB]/20 dark:border-[#3B82F6]/20 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#0F172A] dark:text-[#F8FAFC]">
              <span className="font-semibold">Security Tip:</span> Choose a strong password with a mix of
              uppercase, lowercase, numbers, and special characters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
