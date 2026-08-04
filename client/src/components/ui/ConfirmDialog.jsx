import React from 'react';
import { AlertTriangle, CheckCircle2, Gift, X } from 'lucide-react';

const toneConfig = {
  danger: {
    icon: AlertTriangle,
    iconClass: 'bg-rose-50 text-rose-600',
    confirmClass: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-300',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-600',
    confirmClass: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300',
  },
  reward: {
    icon: Gift,
    iconClass: 'bg-emerald-50 text-emerald-600',
    confirmClass: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300',
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  children,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const config = toneConfig[tone] || toneConfig.danger;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-4 border-b border-slate-200 p-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${config.iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close confirmation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {details && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {details}
            </div>
          )}
          {children}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${config.confirmClass}`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
