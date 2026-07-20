import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { register as registerAccount } from '../api/auth';
import { signupSchema, calculatePasswordStrength } from '../../../lib/validators';

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [regStatus, setRegStatus] = useState(null); // { success: boolean, message: string }
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setRegStatus(null);

    try {
      await registerAccount(data);
      setRegStatus({
        success: true,
        message: 'Registration successful! Redirecting you to login...',
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setRegStatus({
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border-t-4 border-t-emerald-600 border-x border-b border-slate-100/50 overflow-hidden">
      <div className="p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/80 mb-3 shadow-sm">
            {/* GreenCycle Leaf Icon */}
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10 0-4 2-7 5-9 3-2 3-5 3-5s-3 0-5 3c-2 3-5 5-9 5 0-5.5 4.5-10 10-10z"
                className="fill-emerald-500/10 stroke-[1.75]"
              />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none mb-1">
            Create Account
          </h1>
          <p className="text-[14px] text-slate-500 font-medium">
            Join GreenCycle's ESG initiative today.
          </p>
        </div>

        {/* Form Status Messages */}
        {regStatus && (
          <div
            className={`flex gap-3 p-3.5 mb-6 rounded-xl border text-sm transition-all duration-300 ${
              regStatus.success
                ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                : 'bg-red-50/70 border-red-100 text-red-800'
            }`}
          >
            {regStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{regStatus.message}</span>
          </div>
        )}

        {/* SignUp Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Full Name Field */}
          <div className="flex flex-col gap-1.25">
            <label htmlFor="fullName" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              disabled={isLoading}
              {...register('fullName')}
              className={`w-full px-4 py-2.5 border rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
                errors.fullName
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
              } disabled:bg-slate-50 disabled:text-slate-400`}
            />
            {errors.fullName && (
              <span className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                {errors.fullName.message}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.25">
            <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="email"
              type="text"
              placeholder="jane.doe@example.com"
              disabled={isLoading}
              {...register('email')}
              className={`w-full px-4 py-2.5 border rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
              } disabled:bg-slate-50 disabled:text-slate-400`}
            />
            {errors.email && (
              <span className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.25">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isLoading}
                {...register('password')}
                className={`w-full pl-4 pr-11 py-2.5 border rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
                } disabled:bg-slate-50 disabled:text-slate-400`}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                {errors.password.message}
              </span>
            )}
            
            {/* Password Strength Indicator */}
            {password && !errors.password && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${calculatePasswordStrength(password).color}`}
                      style={{ width: `${(calculatePasswordStrength(password).score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {calculatePasswordStrength(password).label}
                  </span>
                </div>
                
                {/* Password Requirements Checklist */}
                <div className="text-[12px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      calculatePasswordStrength(password).checks.length
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {calculatePasswordStrength(password).checks.length ? '✓' : '−'}
                    </span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      calculatePasswordStrength(password).checks.uppercase
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {calculatePasswordStrength(password).checks.uppercase ? '✓' : '−'}
                    </span>
                    <span>One uppercase letter (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      calculatePasswordStrength(password).checks.lowercase
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {calculatePasswordStrength(password).checks.lowercase ? '✓' : '−'}
                    </span>
                    <span>One lowercase letter (a-z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      calculatePasswordStrength(password).checks.number
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {calculatePasswordStrength(password).checks.number ? '✓' : '−'}
                    </span>
                    <span>One number (0-9)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1.25">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isLoading}
                {...register('confirmPassword')}
                className={`w-full pl-4 pr-11 py-2.5 border rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'
                } disabled:bg-slate-50 disabled:text-slate-400`}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-[13px] text-slate-600 font-medium leading-tight">
              <input
                type="checkbox"
                disabled={isLoading}
                {...register('acceptTerms')}
                className="w-4 h-4 rounded mt-0.5 border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
              />
              <span>
                I agree to the{' '}
                <a
                  href="#terms"
                  className="text-slate-700 underline font-semibold hover:text-slate-900 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href="#privacy"
                  className="text-slate-700 underline font-semibold hover:text-slate-900 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Privacy Policy
                </a>.
              </span>
            </label>
            {errors.acceptTerms && (
              <span className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-1">
                {errors.acceptTerms.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white hover:bg-slate-900 active:scale-[0.98] py-3.5 px-5 mt-2 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-4.5 h-4.5 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Log In Link */}
        <div className="mt-8 text-center">
          <p className="text-[14px] text-slate-500 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Log In <span className="font-sans">→</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
