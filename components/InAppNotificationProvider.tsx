import { auth } from '@/firebase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import apiClient from '../services/apiClient';
import { InAppNotification, InAppNotificationType } from './InAppNotification';

interface NotificationContextProps {
  showNotification: (message: string, type?: InAppNotificationType) => void;
  pushToken: string | null;
  registerForPushNotifications: () => Promise<string | null>;
}

// Configure how notifications are handled when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within InAppNotificationProvider');
  return ctx;
}

export const InAppNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<InAppNotificationType>('info');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to send token to backend
  const sendTokenToBackend = async (token: string) => {
    try {
      if(auth.currentUser){
      // Log the payload directly for debugging
      console.log('Sending push token payload:', { token });
      const response = await apiClient.post('/notifications/expo-token', { token });

      
      if (response.success) {
        // showNotification('Push notifications enabled', 'success');
      }}
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  };

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        showNotification('Permission not granted for push notifications', 'error');
        return null;
      }
      
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        showNotification('Project ID not found', 'error');
        return null;
      }
      
      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        
        setPushToken(pushTokenString);
        
        // Send token to backend
        await sendTokenToBackend(pushTokenString);
        
        return pushTokenString;
      } catch (e: unknown) {
        console.error('Error getting push token:', e);
        showNotification('Failed to get push token', 'error');
        return null;
      }
    } else {
      showNotification('Must use physical device for push notifications', 'error');
      return null;
    }
  }, []);

  const showNotification = useCallback((msg: string, t: InAppNotificationType = 'info') => {
    // Clear any existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Clear any existing message first
    setVisible(false);
    setMessage('');
    
    // Small delay to ensure clean state before showing new notification
    setTimeout(() => {
      setMessage(msg);
      setType(t);
      setVisible(true);
      
      // Auto-hide after 3 seconds (matching the component's internal timer)
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        // Clear the message after animation completes
        setTimeout(() => {
          setMessage('');
        }, 400);
      }, 3000);
    }, 50);
  }, []);

  const handleHide = useCallback(() => {
    setVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Clear the message after animation completes
    setTimeout(() => {
      setMessage('');
    }, 400);
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Register for push notifications on mount
    registerForPushNotifications();

    // Listen for notifications received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      
      // Show in-app notification
      const title = notification.request.content.title;
      const body = notification.request.content.body;
      const message = title ? `${title}: ${body}` : body || 'New notification';
      
      showNotification(message, 'info');
    });

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      
      // Handle notification tap - you can navigate to specific screens here
      const data = response.notification.request.content.data;
      
      if (data?.screen) {
        // Navigate to specific screen based on notification data
      }
    });

    return () => {
      // Clean up listeners
      notificationListener.remove();
      responseListener.remove();
    };
  }, [registerForPushNotifications]);

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      pushToken,
      registerForPushNotifications,
    }}>
      {children}
      <InAppNotification
        message={message}
        type={type}
        visible={visible}
        onHide={handleHide}
        disableAutoHide={true}
      />
    </NotificationContext.Provider>
  );
};
