import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PickupCard from './PickupCard';
import { MAX_MY_PICKUPS, getActivePickups } from '../constants';
import { useUnassignedPickups } from '../hooks/useUnassignedPickups';
import { useAssignedPickups } from '../hooks/useAssignedPickups';
import { useClaimPickup } from '../hooks/useClaimPickup';

export default function UnassignedPickupsPanel() {
  const [expanded, setExpanded] = useState(true);
  const [claimErrors, setClaimErrors] = useState({});
  const [claimingId, setClaimingId] = useState(null);

  const { data, isLoading, isError, error } = useUnassignedPickups();
  const assignedQuery = useAssignedPickups();
  const claimMutation = useClaimPickup();

  const pickups = data?.data ?? [];
  const activeCount = getActivePickups(assignedQuery.data?.data ?? []).length;
  const atCapacity = activeCount >= MAX_MY_PICKUPS;

  const handleClaim = async (pickup) => {
    setClaimErrors((prev) => {
      const next = { ...prev };
      delete next[pickup.id];
      return next;
    });
    setClaimingId(pickup.id);

    try {
      await claimMutation.mutateAsync(pickup.id);
    } catch (err) {
      const message =
        err?.status === 409
          ? err.message || 'This order has already been claimed by another driver.'
          : err?.message || 'Failed to claim order';
      setClaimErrors((prev) => ({ ...prev, [pickup.id]: message }));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full p-6 border-b border-slate-200 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">Unassigned Pickups</h2>
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            {pickups.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 p-6">
          {atCapacity && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              You already have {MAX_MY_PICKUPS} active pickups. Return or complete one before claiming
              another.
            </p>
          )}
          {isLoading && <p className="text-sm text-slate-500">Loading unassigned pickups…</p>}
          {isError && (
            <p className="text-sm text-rose-600">{error?.message || 'Failed to load unassigned pickups'}</p>
          )}
          {!isLoading && !isError && pickups.length === 0 && (
            <p className="text-sm text-slate-500">No unassigned pickups</p>
          )}
          {pickups.map((pickup) => (
            <PickupCard
              key={pickup.id}
              pickup={pickup}
              variant="unassigned"
              actionLabel="Claim Order"
              onAction={handleClaim}
              actionLoading={claimingId === pickup.id}
              actionDisabled={atCapacity || (claimingId != null && claimingId !== pickup.id)}
              errorMessage={claimErrors[pickup.id] || ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}
