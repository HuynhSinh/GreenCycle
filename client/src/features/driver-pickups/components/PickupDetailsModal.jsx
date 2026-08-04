import React from 'react';
import { X } from 'lucide-react';
import { STATUS_STYLES } from '../constants';

export default function PickupDetailsModal({ pickup, open, onClose }) {
  if (!open || !pickup) return null;

  const rows = [
    { label: 'Order ID', value: pickup.id },
    { label: 'Status', value: pickup.status },
    { label: 'Customer', value: pickup.customerName || pickup.customer },
    { label: 'Phone', value: pickup.phone || pickup.customerPhone },
    { label: 'Address', value: pickup.address },
    { label: 'Distance', value: pickup.distance },
    { label: 'Category', value: pickup.categoryName },
    { label: 'Estimated Qty', value: pickup.estimatedQuantity },
    { label: 'Actual Qty', value: pickup.actualQuantity },
    { label: 'Note', value: pickup.note },
  ].filter((row) => row.value != null && row.value !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Pickup Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {pickup.status && (
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                STATUS_STYLES[pickup.status] || 'bg-slate-100 text-slate-800'
              }`}
            >
              {pickup.status}
            </span>
          )}

          <dl className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className="text-slate-900 font-medium text-right">{String(row.value)}</dd>
              </div>
            ))}
          </dl>

          {pickup.imageUrl && (
            <img
              src={pickup.imageUrl}
              alt="Confirmation"
              className="mt-2 h-36 w-full object-cover rounded-lg border border-slate-200"
            />
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
