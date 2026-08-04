import React from 'react';
import { Clock, MapPin, Phone, User } from 'lucide-react';
import { STATUS_STYLES } from '../constants';

export default function PickupCard({
  pickup,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionLoading = false,
  secondaryLabel,
  onSecondaryAction,
  secondaryDisabled = false,
  secondaryLoading = false,
  errorMessage = '',
  showStatus = false,
  variant = 'default',
}) {
  const customerName = pickup.customerName || pickup.customer || '—';
  const phone = pickup.phone || pickup.customerPhone;
  const hasActions = Boolean(actionLabel || secondaryLabel);

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        variant === 'unassigned'
          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
          : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="font-bold text-slate-900">{pickup.id}</p>
            {showStatus && pickup.status && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[pickup.status] || 'bg-slate-100 text-slate-800'
                }`}
              >
                {pickup.status}
              </span>
            )}
            {pickup.categoryName && (
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                {pickup.categoryName}
                {pickup.estimatedQuantity != null ? ` · ~${pickup.estimatedQuantity}` : ''}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 shrink-0" />
              <span>{customerName}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{pickup.address}</span>
            </div>
            {pickup.distance && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{pickup.distance}</span>
              </div>
            )}
          </div>
        </div>

        {hasActions && (
          <div className="flex shrink-0 flex-col gap-2 sm:items-stretch">
            {actionLabel && (
              <button
                type="button"
                onClick={() => onAction?.(pickup)}
                disabled={actionDisabled || actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Working…' : actionLabel}
              </button>
            )}
            {secondaryLabel && (
              <button
                type="button"
                onClick={() => onSecondaryAction?.(pickup)}
                disabled={secondaryDisabled || secondaryLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {secondaryLoading ? 'Returning…' : secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {errorMessage && <p className="mt-3 text-sm text-rose-600">{errorMessage}</p>}
    </div>
  );
}
