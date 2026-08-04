import React, { useState } from 'react';
import PickupCard from './PickupCard';
import PickupDetailsModal from './PickupDetailsModal';
import { HISTORY_LIMIT, getHistoryPickups } from '../constants';
import { useAssignedPickups } from '../hooks/useAssignedPickups';

export default function PickupHistoryList() {
  const [detailsTarget, setDetailsTarget] = useState(null);
  const { data, isLoading, isError, error } = useAssignedPickups();
  const pickups = getHistoryPickups(data?.data ?? [], HISTORY_LIMIT);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">History</h2>
          <span className="text-sm text-slate-500">Last {HISTORY_LIMIT} completed</span>
        </div>
        <div className="space-y-4 p-6">
          {isLoading && <p className="text-sm text-slate-500">Loading history…</p>}
          {isError && (
            <p className="text-sm text-rose-600">{error?.message || 'Failed to load history'}</p>
          )}
          {!isLoading && !isError && pickups.length === 0 && (
            <p className="text-sm text-slate-500">No completed pickups yet.</p>
          )}
          {pickups.map((pickup) => (
            <PickupCard
              key={pickup.id}
              pickup={pickup}
              showStatus
              actionLabel="View Details"
              onAction={() => setDetailsTarget(pickup)}
            />
          ))}
        </div>
      </div>

      <PickupDetailsModal
        pickup={detailsTarget}
        open={Boolean(detailsTarget)}
        onClose={() => setDetailsTarget(null)}
      />
    </>
  );
}
