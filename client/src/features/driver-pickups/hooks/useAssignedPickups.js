import { useQuery } from '@tanstack/react-query';
import { fetchAssignedPickups, getDemoMode } from '../api/driverPickups';
import { assignedPickupsQueryKey } from '../constants';

export function useAssignedPickups() {
  return useQuery({
    queryKey: assignedPickupsQueryKey,
    queryFn: async () => {
      const data = await fetchAssignedPickups();
      return { data, usingDemoData: getDemoMode() };
    },
  });
}
