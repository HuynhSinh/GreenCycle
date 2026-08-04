import React, { useState } from 'react';
import PickupCard from './PickupCard';
import PickupDetailsModal from './PickupDetailsModal';
import { getActivePickups } from '../constants';
import { useAssignedPickups } from '../hooks/useAssignedPickups';

export default function AssignedPickupsList() {
  const [detailsTarget, setDetailsTarget] = useState(null);
  const { data, isLoading, isError, error } = useAssignedPickups();
  const pickups = getActivePickups(data?.data ?? []);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Assigned Pickups</h2>
        </div>
        <div className="space-y-4 p-6">
          {isLoading && <p className="text-sm text-slate-500">Loading assigned pickups…</p>}
          {isError && (
            <p className="text-sm text-rose-600">{error?.message || 'Failed to load assigned pickups'}</p>
          )}
          {!isLoading && !isError && pickups.length === 0 && (
            <p className="text-sm text-slate-500">No assigned pickups yet.</p>
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
