import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { login } from '../api/auth';
import { loginSchema } from '../../../lib/validators';

export function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null); // { success: boolean, message: string }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthStatus(null);

    try {
      const response = await login(data);
      
      // Cookies đã được set bởi backend (HTTP-only)
      // Lưu user info vào localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.user));

      setAuthStatus({
        success: true,
        message: 'Successfully authenticated. Redirecting...',
      });

      // Redirect dựa vào role sau 1 giây
      setTimeout(() => {
        const dashboardPaths = {
          ADMIN: '/dashboard/admin',
          CUSTOMER: '/dashboard/customer',
          DRIVER: '/dashboard/driver',
        };
        const path = dashboardPaths[response.user.role] || '/login';
        navigate(path);
      }, 1000);
    } catch (error) {
      setAuthStatus({
        success: false,
        message: error.message || 'Invalid email or password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-100/50">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/80 mb-3 shadow-sm">
          {/* Custom GreenCycle Leaf Icon */}
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
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z"
              style={{ display: 'none' }} // Placeholder if we want the actual leaf
            />
            {/* Beautiful Leaf path */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9 4.97 0 9 4.03 9 9v1c0 2.21-1.79 4-4 4h-2c-1.1 0-2 .9-2 2v2zm0-18c-3.87 0-7 3.13-7 7s3.13 7 7 7c2.21 0 4-1.79 4-4V11c0-2.21-1.79-4-4-4h-2"
              style={{ display: 'none' }}
            />
            {/* True clean modern leaf path */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10 0-4 2-7 5-9 3-2 3-5 3-5s-3 0-5 3c-2 3-5 5-9 5 0-5.5 4.5-10 10-10z"
              className="fill-emerald-500/10 stroke-[1.75]"
            />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none mb-1">
          GreenCycle
        </h1>
        <p className="text-[14px] text-slate-500 font-medium">
          Sign in to the ESG Admin Portal
        </p>
      </div>

      {/* Form Status Messages */}
      {authStatus && (
        <div
          className={`flex gap-3 p-3.5 mb-6 rounded-xl border text-sm transition-all duration-300 ${
            authStatus.success
              ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
              : 'bg-red-50/70 border-red-100 text-red-800'
          }`}
        >
          {authStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{authStatus.message}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Email Address
          </label>
          <input
            id="email"
            type="text"
            placeholder="name@company.com"
            disabled={isLoading}
            {...register('email')}
            className={`w-full px-4 py-3 border rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
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
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <a
              href="#forgot"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              disabled={isLoading}
              {...register('password')}
              className={`w-full pl-4 pr-11 py-3 border rounded-xl text-[15px] outline-none transition-all placeholder:text-slate-400/80 ${
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
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-[13px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group text-[14px] text-slate-600 font-medium">
            <input
              type="checkbox"
              disabled={isLoading}
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span>Remember me</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white hover:bg-slate-900 active:scale-[0.98] py-3.5 px-5 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <span>SIGNING IN...</span>
            </>
          ) : (
            <>
              <span>SIGN IN</span>
              <LogIn className="w-4.5 h-4.5 text-white" />
            </>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-[14px] text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Sign up <span className="font-sans">→</span>
          </Link>
        </p>
      </div>

      {/* Footer Secure Badge */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          Secure Enterprise Authentication
        </span>
      </div>
    </div>
  );
}
