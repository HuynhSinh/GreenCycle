import { apiRequest } from '../../../lib/api-client';

export function getDriverAssignments() {
  return apiRequest('/driver/assignments');
}

export function updateDriverAssignmentStatus(assignmentId, payload) {
  return apiRequest(`/driver/assignments/${assignmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
