import { apiRequest } from '../../../lib/api-client';

export function getCustomerWallet() {
  return apiRequest('/customer/wallet');
}

export function getCustomerRewards() {
  return apiRequest('/customer/rewards');
}

export function redeemCustomerReward(rewardId) {
  return apiRequest(`/customer/rewards/${rewardId}/redeem`, {
    method: 'POST',
  });
}
