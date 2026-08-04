import React, { useState } from 'react';
import PickupCard from './PickupCard';
import CompletePickupModal from './CompletePickupModal';
import {
  MAX_MY_PICKUPS,
  PICKUP_STATUSES,
  getActivePickups,
} from '../constants';
import { useAssignedPickups } from '../hooks/useAssignedPickups';
import { useUpdatePickupStatus } from '../hooks/useUpdatePickupStatus';
import { useReleasePickup } from '../hooks/useReleasePickup';

function actionLabelForStatus(status) {
  if (status === PICKUP_STATUSES.ASSIGNED) return 'Start Driving';
  if (status === PICKUP_STATUSES.COLLECTING) return 'Complete';
  return null;
}

export default function MyPickupsList() {
  const [completeTarget, setCompleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [busyKind, setBusyKind] = useState(null);
  const [actionErrors, setActionErrors] = useState({});

  const { data, isLoading, isError, error } = useAssignedPickups();
  const updateMutation = useUpdatePickupStatus();
  const releaseMutation = useReleasePickup();

  const pickups = getActivePickups(data?.data ?? []).slice(0, MAX_MY_PICKUPS);

  const clearError = (id) => {
    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAction = async (pickup) => {
    if (pickup.status === PICKUP_STATUSES.COLLECTING) {
      setCompleteTarget(pickup);
      return;
    }

    if (pickup.status === PICKUP_STATUSES.ASSIGNED) {
      clearError(pickup.id);
      setBusyId(pickup.id);
      setBusyKind('primary');
      try {
        await updateMutation.mutateAsync({ id: pickup.id, status: PICKUP_STATUSES.COLLECTING });
      } catch (err) {
        setActionErrors((prev) => ({
          ...prev,
          [pickup.id]: err?.message || 'Failed to update status',
        }));
      } finally {
        setBusyId(null);
        setBusyKind(null);
      }
    }
  };

  const handleReturn = async (pickup) => {
    clearError(pickup.id);
    setBusyId(pickup.id);
    setBusyKind('secondary');
    try {
      await releaseMutation.mutateAsync(pickup.id);
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        [pickup.id]: err?.message || 'Failed to return pickup',
      }));
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  };

  const handleCompleteConfirm = async (payload) => {
    if (!completeTarget) return;
    setBusyId(completeTarget.id);
    setBusyKind('primary');
    try {
      await updateMutation.mutateAsync({ id: completeTarget.id, ...payload });
      setCompleteTarget(null);
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        [completeTarget.id]: err?.message || 'Failed to complete pickup',
      }));
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">My Pickups</h2>
          <span className="text-sm text-slate-500">
            {pickups.length}/{MAX_MY_PICKUPS} slots
          </span>
        </div>
        <div className="space-y-4 p-6">
          {isLoading && <p className="text-sm text-slate-500">Loading your pickups…</p>}
          {isError && (
            <p className="text-sm text-rose-600">{error?.message || 'Failed to load your pickups'}</p>
          )}
          {!isLoading && !isError && pickups.length === 0 && (
            <p className="text-sm text-slate-500">No pickups claimed yet.</p>
          )}
          {pickups.map((pickup) => (
            <PickupCard
              key={pickup.id}
              pickup={pickup}
              showStatus
              actionLabel={actionLabelForStatus(pickup.status)}
              onAction={handleAction}
              actionLoading={busyId === pickup.id && busyKind === 'primary'}
              actionDisabled={busyId != null && busyId !== pickup.id}
              secondaryLabel={
                pickup.status === PICKUP_STATUSES.ASSIGNED ? 'Return' : undefined
              }
              onSecondaryAction={handleReturn}
              secondaryLoading={busyId === pickup.id && busyKind === 'secondary'}
              secondaryDisabled={busyId != null && busyId !== pickup.id}
              errorMessage={actionErrors[pickup.id] || ''}
            />
          ))}
        </div>
      </div>

      <CompletePickupModal
        pickup={completeTarget}
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleCompleteConfirm}
        isSubmitting={busyId === completeTarget?.id && busyKind === 'primary'}
      />
    </>
  );
}
