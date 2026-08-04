import { useMutation, useQueryClient } from '@tanstack/react-query';
import { releasePickup } from '../api/driverPickups';
import { DRIVER_PICKUPS_QUERY_KEY } from '../constants';

export function useReleasePickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => releasePickup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVER_PICKUPS_QUERY_KEY });
    },
  });
}
