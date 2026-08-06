import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';
import { resetPassword } from '../api/auth';
import { resetPasswordSchema } from '../../../lib/validators';
import { calculatePasswordStrength } from '../../../lib/validators';
import { friendlyError } from '../../../lib/messages';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') || '',
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await resetPassword(data);
      setStatus({
        success: true,
        message: response.message || 'Password has been reset successfully. Please sign in with your new password.',
      });
      setTimeout(() => navigate('/login'), 1400);
    } catch (error) {
      setStatus({
        success: false,
        message: friendlyError(error, 'Unable to reset password. The OTP may be invalid or expired.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-slate-100/50 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-8 flex flex-col items-center">
        <BrandLogo className="mb-2 h-32 w-full max-w-[280px]" />
        <p className="text-[14px] font-medium text-slate-500">Create a new GreenCycle password</p>
      </div>

      {status && (
        <div
          className={`mb-6 flex gap-3 rounded-xl border p-3.5 text-sm ${
            status.success
              ? 'border-emerald-100 bg-emerald-50/70 text-emerald-800'
              : 'border-red-100 bg-red-50/70 text-red-800'
          }`}
        >
          {status.success ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Email Address <span className="text-rose-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            disabled={isLoading}
            {...register('email')}
            className={`w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
              errors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
            } disabled:bg-slate-50 disabled:text-slate-400`}
          />
          {errors.email && <span className="text-[13px] font-medium text-red-500">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            OTP Code <span className="text-rose-600">*</span>
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            disabled={isLoading}
            {...register('otp')}
            className={`w-full rounded-xl border px-4 py-3 text-center text-[20px] font-bold outline-none transition-all placeholder:text-slate-400/80 ${
              errors.otp
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
            } disabled:bg-slate-50 disabled:text-slate-400`}
          />
          {errors.otp && <span className="text-[13px] font-medium text-red-500">{errors.otp.message}</span>}
        </div>

        <PasswordField
          id="password"
          label="New Password"
          register={register('password')}
          error={errors.password?.message}
          show={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          disabled={isLoading}
        />

        {password && !errors.password && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${calculatePasswordStrength(password).color}`}
                  style={{ width: `${(calculatePasswordStrength(password).score / 5) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">
                {calculatePasswordStrength(password).label}
              </span>
            </div>
          </div>
        )}

        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((value) => !value)}
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:bg-slate-900 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
        >
          <span>{isLoading ? 'RESETTING PASSWORD...' : 'RESET PASSWORD'}</span>
          <KeyRound className="h-4.5 w-4.5 text-white" />
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-[14px] font-semibold text-emerald-600 transition-colors hover:text-emerald-700">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function PasswordField({ id, label, register, error, show, onToggle, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label} <span className="text-rose-600">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder="********"
          disabled={disabled}
          {...register}
          className={`w-full rounded-xl border py-3 pl-4 pr-11 text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
          } disabled:bg-slate-50 disabled:text-slate-400`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <span className="text-[13px] font-medium text-red-500">{error}</span>}
    </div>
  );
}
