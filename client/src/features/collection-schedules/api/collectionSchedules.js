import { apiRequest } from '../../../lib/api-client';

export function getCollectionSchedule({ date, district = 'District 5', status = 'ALL', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (date) params.set('date', date);
  if (district) params.set('district', district);
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return apiRequest(`/admin/collection-schedules?${params.toString()}`);
}

export function assignCollectionSchedule(payload) {
  return apiRequest('/admin/collection-schedules/assign', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function approveCollectionSchedule(requestId) {
  return apiRequest(`/admin/collection-schedules/${requestId}/approve`, {
    method: 'PATCH',
  });
}

export function rejectCollectionSchedule(requestId, reason) {
  return apiRequest(`/admin/collection-schedules/${requestId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}
