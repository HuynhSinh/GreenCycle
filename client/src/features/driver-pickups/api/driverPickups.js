import { apiRequest, ApiError } from '../../../lib/api-client';
import {
  getMockAssigned,
  getMockUnassigned,
  isDemoMode,
  mockClaimPickup,
  mockReleasePickup,
  mockUpdatePickupStatus,
  setDemoMode,
} from '../mockData';

function shouldUseFallback(error) {
  if (!(error instanceof ApiError) && !(error instanceof TypeError) && !error?.status) {
    return true;
  }
  if (error instanceof TypeError) return true;
  const status = error.status;
  if (!status) return true;
  if (status === 404) return true;
  if (status >= 500) return true;
  return false;
}

async function withMockFallback(requestFn, mockFn) {
  if (isDemoMode()) {
    return mockFn();
  }

  try {
    const result = await requestFn();
    setDemoMode(false);
    return result;
  } catch (error) {
    if (error?.status === 409 || error?.status === 400) {
      throw error;
    }
    if (shouldUseFallback(error)) {
      setDemoMode(true);
      return mockFn();
    }
    throw error;
  }
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function getDemoMode() {
  return isDemoMode();
}

export async function fetchUnassignedPickups() {
  return withMockFallback(
    async () => normalizeList(await apiRequest('/api/driver/pickups/unassigned')),
    () => getMockUnassigned()
  );
}

export async function fetchAssignedPickups() {
  return withMockFallback(
    async () => normalizeList(await apiRequest('/api/driver/pickups')),
    () => getMockAssigned()
  );
}

export async function claimPickup(id) {
  return withMockFallback(
    () =>
      apiRequest(`/api/driver/pickups/${id}/claim`, {
        method: 'POST',
      }),
    () => mockClaimPickup(id)
  );
}

export async function releasePickup(id) {
  return withMockFallback(
    () =>
      apiRequest(`/api/driver/pickups/${id}/release`, {
        method: 'POST',
      }),
    () => mockReleasePickup(id)
  );
}

export async function updatePickupStatus(id, payload) {
  return withMockFallback(
    () =>
      apiRequest(`/api/driver/pickups/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    () => mockUpdatePickupStatus(id, payload)
  );
}
