import { apiRequest } from '../../../lib/api-client';

export function getAdminRewards({ q = '', type = 'ALL', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (type) params.set('type', type);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return apiRequest(`/admin/rewards?${params.toString()}`);
}

export function createAdminReward(payload) {
  return apiRequest('/admin/rewards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminReward(rewardId, payload) {
  return apiRequest(`/admin/rewards/${rewardId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateAdminRewardInventory(rewardId, payload) {
  return apiRequest(`/admin/rewards/${rewardId}/inventory`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
