import { apiRequest } from '../../../lib/api-client';

export function getPickupBookingData() {
  return apiRequest('/customer/pickup-booking');
}

export function getCustomerPickups() {
  return apiRequest('/customer/pickups');
}

export function createCustomerPickup(payload) {
  return apiRequest('/customer/pickups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCustomerPickup(pickupId) {
  return apiRequest(`/customer/pickups/${pickupId}`);
}

export function updateCustomerPickup(pickupId, payload) {
  return apiRequest(`/customer/pickups/${pickupId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function cancelCustomerPickup(pickupId) {
  return apiRequest(`/customer/pickups/${pickupId}/cancel`, {
    method: 'PATCH',
  });
}
