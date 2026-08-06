import React from 'react';
import { ForgotPasswordForm } from '../../features/auth/components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/70 p-4 selection:bg-emerald-100 selection:text-emerald-900 md:p-8">
      <div className="relative flex w-full justify-center py-12 md:py-20">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
