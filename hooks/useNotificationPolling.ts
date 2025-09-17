import { useAppStore } from '@/store';
import { useEffect } from 'react';

export function useNotificationPolling() {
  const { fetchUnreadNotificationCount } = useAppStore();

  useEffect(() => {
    // Only fetch once on mount, no polling
    fetchUnreadNotificationCount();
  }, []); // No interval, just initial fetch
}
