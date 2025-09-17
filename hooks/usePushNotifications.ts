import * as Notifications from 'expo-notifications';
import { useNotification } from '../components/InAppNotificationProvider';

export const usePushNotifications = () => {
  const { pushToken, registerForPushNotifications, showNotification } = useNotification();

  const sendPushNotification = async (
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ) => {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      showNotification('Failed to send notification', 'error');
      throw error;
    }
  };

  const schedulePushNotification = async (
    title: string,
    body: string,
    seconds: number,
    data?: any
  ) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data || {},
        },
        trigger: { seconds: seconds },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      showNotification('Failed to schedule notification', 'error');
      throw error;
    }
  };

  const cancelPushNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      showNotification('Failed to cancel notification', 'error');
      throw error;
    }
  };

  const getBadgeCount = async () => {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  };

  const setBadgeCount = async (count: number) => {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
      showNotification('Failed to update badge count', 'error');
    }
  };

  return {
    pushToken,
    registerForPushNotifications,
    sendPushNotification,
    schedulePushNotification,
    cancelPushNotification,
    getBadgeCount,
    setBadgeCount,
  };
};
