import React from 'react';
import { ResetPasswordForm } from '../../features/auth/components/ResetPasswordForm';

export function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/70 p-4 selection:bg-emerald-100 selection:text-emerald-900 md:p-8">
      <div className="relative flex w-full justify-center py-12 md:py-20">
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
