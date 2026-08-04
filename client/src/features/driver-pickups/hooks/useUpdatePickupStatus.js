import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePickupStatus } from '../api/driverPickups';
import { DRIVER_PICKUPS_QUERY_KEY } from '../constants';

export function useUpdatePickupStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }) => updatePickupStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVER_PICKUPS_QUERY_KEY });
    },
  });
}
