import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';
import { forgotPassword } from '../api/auth';
import { forgotPasswordSchema } from '../../../lib/validators';
import { friendlyError } from '../../../lib/messages';

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await forgotPassword(data);
      setStatus({
        success: true,
        message: response.message || 'If that email exists, a password reset OTP has been sent.',
        email: data.email,
        expiresInMinutes: response.expiresInMinutes,
      });
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      setStatus({
        success: false,
        message: friendlyError(error, 'Unable to send a reset OTP. Please try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-slate-100/50 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-8 flex flex-col items-center">
        <BrandLogo className="mb-2 h-32 w-full max-w-[280px]" />
        <p className="text-[14px] font-medium text-slate-500">Reset access to your account</p>
      </div>

      {status && (
        <div
          className={`mb-6 rounded-xl border p-3.5 text-sm ${
            status.success
              ? 'border-emerald-100 bg-emerald-50/70 text-emerald-800'
              : 'border-red-100 bg-red-50/70 text-red-800'
          }`}
        >
          <div className="flex gap-3">
            {status.success ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{status.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Email Address <span className="text-rose-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
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

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:bg-slate-900 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
        >
          <span>{isLoading ? 'SENDING OTP...' : 'SEND OTP'}</span>
          <Mail className="h-4.5 w-4.5 text-white" />
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-[14px] font-semibold text-emerald-600 transition-colors hover:text-emerald-700">
          Back to sign in
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6">
        <ShieldCheck className="h-4 w-4 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Secure Password Recovery
        </span>
      </div>
    </div>
  );
}
