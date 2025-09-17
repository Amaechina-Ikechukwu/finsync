import { useNotification } from '@/components/InAppNotificationProvider';
import { setupNotificationListener } from '@/services/firebaseNotifications';
import { useAppStore as useDataStore } from '@/store';
import { useAppStore } from '@/store/appStore';
import { useEffect, useRef } from 'react';

export function useFirebaseNotifications() {
  const { user } = useAppStore();
  const { setUnreadNotificationCount, refreshData } = useDataStore();
  const { showNotification } = useNotification();
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
      return;
    }

    // Start listening for notifications with in-app notification support
    listenerRef.current = setupNotificationListener(
      user.uid,
      (message, type) => {
        showNotification(message, type);
      },
      (count) => {
        setUnreadNotificationCount(count);
      },
      () => {
        // Refresh app data when new notifications arrive
        refreshData();
      }
    );

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, [user?.uid, setUnreadNotificationCount, showNotification, refreshData]);
}
