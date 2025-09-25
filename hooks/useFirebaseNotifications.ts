import { useNotification } from '@/components/InAppNotificationProvider';
import { auth } from '@/firebase';
import { setupNotificationListener } from '@/services/firebaseNotifications';
import { useAppStore as useDataStore } from '@/store';
import { useAppStore } from '@/store/appStore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';

export function useFirebaseNotifications() {
  const { user } = useAppStore();
  const { setUnreadNotificationCount, refreshData } = useDataStore();
  const { showNotification } = useNotification();
  const listenerRef = useRef<(() => void) | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);

  // Keep a stable view of the current Firebase auth UID
  useEffect(() => {
    const detach = onAuthStateChanged(auth, (u) => {
      setAuthUid(u?.uid ?? null);
    });
    return () => detach();
  }, []);

  useEffect(() => {
    const uid = user?.uid ?? authUid ?? auth.currentUser?.uid;
    if (!uid) {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
      return;
    }

    // Start listening to Firebase DB notifications and react to wallet-related ones
    listenerRef.current = setupNotificationListener(
      uid,
      (message, type) => {
        showNotification(message, type);
      },
      (count) => {
        setUnreadNotificationCount(count);
      },
      () => {
        // Wallet-related event: refresh data to update balance
        refreshData();
      }
    );

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, [user?.uid, authUid, setUnreadNotificationCount, showNotification, refreshData]);
}
