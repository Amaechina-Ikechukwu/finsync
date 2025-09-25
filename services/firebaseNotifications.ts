import { database } from '@/firebase';
import { get, onValue, ref } from 'firebase/database';

// Enhanced notification listener that triggers in-app notifications
export function listenForNotifications(
  userUid: string,
  onInAppNotification: (notification: { message: string; type: 'info' | 'success' | 'error' }) => void,
  onCountUpdate?: (count: number) => void,
  onWalletEvent?: () => void
) {
  const notificationsRef = ref(database, `notifications/users/${userUid}`);
  let previousNotificationIds = new Set<string>();

  const unsubscribe = onValue(
    notificationsRef,
    (snapshot) => {
      const raw = snapshot.val();

      // Flatten structure: support both
      // A) notifications/users/{uid}/{itemId} => { data?: {...} | ... }
      // B) notifications/users/{uid}/{groupId}/{itemId} => { data?: {...} | ... }
      type FlatItem = { key: string; data: any };
      const flat: FlatItem[] = [];

      if (raw && typeof raw === 'object') {
        for (const [id1, v1] of Object.entries<any>(raw)) {
          if (v1 == null) continue;
          if (typeof v1 === 'object' && !Array.isArray(v1)) {
            // Case A: single level if it directly has a data payload or recognizable fields
            const maybeData = (v1 as any).data ?? v1;
            const hasDirectData = typeof maybeData === 'object' && (
              'title' in maybeData || 'body' in maybeData || 'message' in maybeData || 'heading' in maybeData || 'subject' in maybeData
            );

            if (hasDirectData) {
              const data = (v1 as any).data ?? v1;
              flat.push({ key: `${id1}`, data });
            } else {
              // Case B: two levels deep
              for (const [id2, v2] of Object.entries<any>(v1)) {
                if (v2 == null) continue;
                const data = typeof v2 === 'object' && 'data' in (v2 as any) ? (v2 as any).data : v2;
                flat.push({ key: `${id1}/${id2}`, data });
              }
            }
          } else {
            // Primitive value, treat as data
            flat.push({ key: `${id1}`, data: v1 });
          }
        }
      }

      const currentIds = new Set(flat.map((f) => f.key));
      // Prefer unread count if items have an `isRead` flag
      const hasIsReadFlag = flat.some((f) => typeof f.data === 'object' && f.data && 'isRead' in f.data);
      const unreadCount = hasIsReadFlag
        ? flat.filter((f) => f?.data?.isRead === false).length
        : flat.length;
      if (onCountUpdate) onCountUpdate(unreadCount);

      // Only process deltas after first snapshot
      if (flat.length > 0 && previousNotificationIds.size > 0) {
        try {
          const newItems = flat.filter((f) => !previousNotificationIds.has(f.key));
          if (newItems.length > 0) {
            let walletTriggered = false;
            newItems.forEach(({ data }) => {
              const title: string = String(data?.title ?? data?.heading ?? data?.subject ?? '');
              const body: string = String(data?.body ?? data?.message ?? '');
              const rawType: string = String(data?.type ?? '').toLowerCase();
              const type: 'info' | 'success' | 'error' = rawType === 'success' || rawType === 'ok'
                ? 'success'
                : rawType === 'error' || rawType === 'failed'
                ? 'error'
                : 'info';

              // Always show the in-app notification for any new item
              const message = body && body.trim().length > 0
                ? (title ? `${title}: ${body}` : body)
                : (title || 'New notification');
              onInAppNotification({ message, type });

              // Additionally, detect wallet updates to trigger a data refresh
              const isWallet = title.toLowerCase().includes('wallet') || body.toLowerCase().includes('wallet');
              if (isWallet) {
                walletTriggered = true;
              }
            });
            if (walletTriggered && onWalletEvent) onWalletEvent();
          }
        } catch (err) {
          console.error('Firebase wallet notification processing error:', err);
        }
      }

      // Debug: log counts to help diagnose listener activity
      // console.debug('[Firebase] notifications snapshot:', {
      //   total: flat.length,
      //   newSinceLast: flat.filter((f) => !previousNotificationIds.has(f.key)).length,
      // });

      previousNotificationIds = currentIds;
    },
    (error) => {
      console.error('Firebase notification listener error:', error);
    }
  );

  // Correctly return the unsubscribe function from onValue
  return () => {
    try {
      // console.debug('[Firebase] notifications listener: detaching');
      unsubscribe();
    } catch (e) {
      // Ignore errors during cleanup
    }
  };
}

// Utility function to integrate with in-app notification system
export function setupNotificationListener(
  userUid: string,
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void,
  updateCount?: (count: number) => void,
  onWalletEvent?: () => void
) {
  return listenForNotifications(
    userUid,
    (notification) => {
      // Show for all new notifications
      showNotification(notification.message, notification.type);
    },
    updateCount,
    onWalletEvent
  );
}

// Test function to check Firebase connectivity and data
export async function testFirebaseConnection(userUid: string) {
  try {
    // Test specific user path
    const userRef = ref(database, `notifications/users/${userUid}`);
    const userSnapshot = await get(userRef);
    
    return {
      connected: true,
      userNotificationsExist: userSnapshot.exists(),
      notificationCount: userSnapshot.exists() ? Object.keys(userSnapshot.val()).length : 0
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return { connected: false, error };
  }
}

// Test function to manually add a notification to Firebase (for testing)
export async function addTestNotification(userUid: string, message: string, type: string = 'info') {
  try {
    const { ref: dbRef, push, set } = await import('firebase/database');
    const notificationsRef = dbRef(database, `notifications/users/${userUid}`);
    // Create a parent group id, then a child id under it to match id>id>data
    const groupRef = push(notificationsRef);
    const itemRef = push(groupRef);

    const notification = {
      id: itemRef.key,
      title: message,
      body: `Test notification: ${message}`,
      type: type,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: userUid
    };

    await set(itemRef, { data: notification });
    return notification;
  } catch (error) {
    console.error('Error adding test notification:', error);
    throw error;
  }
}
