import { database } from '@/firebase';
import { get, off, onValue, ref } from 'firebase/database';

// Enhanced notification listener that triggers in-app notifications
export function listenForNotifications(
  userUid: string, 
  onNotificationReceived: (notification: { message: string; type: 'info' | 'success' | 'error' }) => void,
  onCountUpdate?: (count: number) => void,
  onNewNotifications?: () => void
) {
  const notificationsRef = ref(database, `notifications/users/${userUid}`);
  let previousNotificationIds = new Set<string>();
  
  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    
    // Safely handle the data - ensure it's an object before calling Object.entries
    let notifications: [string, any][] = [];
    let currentCount = 0;
    
    if (data && typeof data === 'object') {
      notifications = Object.entries(data);
      currentCount = notifications.length;
    }
    
    // Update count if callback provided
    if (onCountUpdate) {
      onCountUpdate(currentCount);
    }
    
    // Check for new notifications by comparing IDs
    if (notifications && notifications.length > 0) {
      try {
        const currentNotificationIds = new Set(notifications.map(([id]) => id));
        
        // Find new notifications (IDs that weren't in previous set)
        const newNotificationIds = notifications.filter(([id]) => !previousNotificationIds.has(id));
        
        if (newNotificationIds.length > 0 && previousNotificationIds.size > 0) {
          // Show in-app notification for each new notification
          newNotificationIds.forEach(([id, notification]: [string, any]) => {
            // Create detailed message based on notification type and data
            let message = notification.title || 'New notification';
            
            // Add more details based on notification type
            if (notification.type === 'wallet' && notification.data?.amount) {
              message = `${notification.title} - ₦${notification.data.amount.toLocaleString()}`;
            } else if (notification.type === 'transfer' && notification.data?.amount) {
              message = `${notification.title} - ₦${notification.data.amount.toLocaleString()}`;
            } else if (notification.type === 'transaction' && notification.body) {
              message = notification.body; // Use body for transaction details
            } else if (notification.body && notification.body !== notification.title) {
              message = `${notification.title}: ${notification.body}`;
            }
            
            // Map notification types to in-app notification types
            let type: 'info' | 'success' | 'error' = 'info';
            
            if (notification.type === 'wallet' || notification.type === 'transaction') {
              type = 'success';
            } else if (notification.type === 'transfer') {
              // Check if it's successful or just initiated
              if (notification.title?.includes('Successful') || notification.body?.includes('successful')) {
                type = 'success';
              } else {
                type = 'info';
              }
            } else if (notification.type === 'error' || notification.title?.includes('Failed')) {
              type = 'error';
            }
            
            onNotificationReceived({ message, type });
          });
          
          // Trigger data refresh when new notifications arrive
          if (onNewNotifications) {
            onNewNotifications();
          }
        }
        
        // Update the previous notification IDs set
        previousNotificationIds = currentNotificationIds;
      } catch (error) {
        console.error('Firebase notification processing error:', error);
      }
    } else {
      // No notifications, reset the set
      previousNotificationIds = new Set();
    }
  }, (error) => {
    console.error('Firebase notification listener error:', error);
  });
  
  return () => off(notificationsRef, 'value', unsubscribe);
}

// Utility function to integrate with in-app notification system
export function setupNotificationListener(
  userUid: string,
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void,
  updateCount?: (count: number) => void,
  onNewNotifications?: () => void
) {
  return listenForNotifications(
    userUid,
    (notification) => {
      showNotification(notification.message, notification.type);
    },
    updateCount,
    onNewNotifications
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
    const newNotificationRef = push(notificationsRef);
    
    const notification = {
      id: newNotificationRef.key,
      title: message,
      body: `Test notification: ${message}`,
      type: type,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: userUid
    };
    
    await set(newNotificationRef, notification);
    return notification;
  } catch (error) {
    console.error('Error adding test notification:', error);
    throw error;
  }
}
