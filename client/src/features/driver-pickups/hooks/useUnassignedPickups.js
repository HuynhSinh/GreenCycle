import { useQuery } from '@tanstack/react-query';
import { fetchUnassignedPickups, getDemoMode } from '../api/driverPickups';
import { unassignedPickupsQueryKey } from '../constants';

export function useUnassignedPickups() {
  return useQuery({
    queryKey: unassignedPickupsQueryKey,
    queryFn: async () => {
      const data = await fetchUnassignedPickups();
      return { data, usingDemoData: getDemoMode() };
    },
  });
}
