import React from 'react';
import { LoginForm } from '../../features/auth/components/LoginForm';

export function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/70 p-4 md:p-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="relative w-full flex justify-center py-12 md:py-20">
        {/* Subtle decorative background blur shapes */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-100/20 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-[8000ms]"></div>
        
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
