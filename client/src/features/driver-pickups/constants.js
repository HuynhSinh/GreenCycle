export const DRIVER_PICKUPS_QUERY_KEY = ['driver-pickups'];

export const unassignedPickupsQueryKey = [...DRIVER_PICKUPS_QUERY_KEY, 'unassigned'];
export const assignedPickupsQueryKey = [...DRIVER_PICKUPS_QUERY_KEY, 'assigned'];

export const MAX_MY_PICKUPS = 3;
export const HISTORY_LIMIT = 10;

export const STATUS_STYLES = {
  ASSIGNED: 'bg-yellow-100 text-yellow-800',
  COLLECTING: 'bg-blue-100 text-blue-800',
  COLLECTED: 'bg-emerald-100 text-emerald-800',
};

export const PICKUP_STATUSES = {
  ASSIGNED: 'ASSIGNED',
  COLLECTING: 'COLLECTING',
  COLLECTED: 'COLLECTED',
};

export function isActivePickupStatus(status) {
  return status === PICKUP_STATUSES.ASSIGNED || status === PICKUP_STATUSES.COLLECTING;
}

export function getActivePickups(pickups = []) {
  return pickups.filter((pickup) => isActivePickupStatus(pickup.status));
}

export function getHistoryPickups(pickups = [], limit = HISTORY_LIMIT) {
  return [...pickups]
    .filter((pickup) => pickup.status === PICKUP_STATUSES.COLLECTED)
    .sort((a, b) => {
      const aTime = new Date(a.completedAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.completedAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}
