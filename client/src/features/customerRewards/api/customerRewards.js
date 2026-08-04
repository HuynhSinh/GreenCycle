import { apiRequest } from '../../../lib/api-client';

export function getCustomerWallet() {
  return apiRequest('/customer/wallet');
}

export function getRewards({ q = '', type = 'ALL', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (type) params.set('type', type);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return apiRequest(`/customer/rewards?${params.toString()}`);
}

export function redeemReward(rewardId) {
  return apiRequest(`/customer/rewards/${rewardId}/redeem`, {
    method: 'POST',
  });
}
