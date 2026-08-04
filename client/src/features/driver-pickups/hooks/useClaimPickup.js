import { useMutation, useQueryClient } from '@tanstack/react-query';
import { claimPickup } from '../api/driverPickups';
import { DRIVER_PICKUPS_QUERY_KEY } from '../constants';

export function useClaimPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => claimPickup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVER_PICKUPS_QUERY_KEY });
    },
  });
}
