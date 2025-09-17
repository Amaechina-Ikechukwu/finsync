import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

/**
 * Component that initializes Firebase notifications listener
 * This component must be rendered inside InAppNotificationProvider
 */
export function FirebaseNotificationsInitializer() {
  useFirebaseNotifications();
  return null; // This component doesn't render anything
}
