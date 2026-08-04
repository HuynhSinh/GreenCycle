import { apiRequest } from '../../../lib/api-client';

export function getAdminDrivers({ q = '', status = 'ALL', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return apiRequest(`/admin/drivers?${params.toString()}`);
}

export function createAdminDriver(payload) {
  return apiRequest('/admin/drivers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function approveAdminDriver(accountId) {
  return apiRequest(`/admin/drivers/${accountId}/approve`, {
    method: 'PATCH',
  });
}

export function enableAdminDriver(accountId) {
  return apiRequest(`/admin/drivers/${accountId}/enable`, {
    method: 'PATCH',
  });
}

export function disableAdminDriver(accountId) {
  return apiRequest(`/admin/drivers/${accountId}/disable`, {
    method: 'PATCH',
  });
}

export function getDriverProfile() {
  return apiRequest('/driver/profile');
}

export function updateDriverProfile(payload) {
  return apiRequest('/driver/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
