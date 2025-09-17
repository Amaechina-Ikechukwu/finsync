import React from 'react';
import { StyleSheet, View } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import AppButton from './ui/AppButton';

export default function PushNotificationDemo() {
  const { 
    pushToken, 
    registerForPushNotifications, 
    sendPushNotification, 
    schedulePushNotification,
    setBadgeCount,
    getBadgeCount
  } = usePushNotifications();

  const handleRegister = async () => {
    await registerForPushNotifications();
  };

  const handleSendTest = async () => {
    if (pushToken) {
      try {
        await sendPushNotification(
          pushToken,
          'Test Notification',
          'This is a test push notification from Finsync!',
          { screen: '/notifications' }
        );
      } catch (error) {
        console.error('Failed to send test notification:', error);
      }
    }
  };

  const handleScheduleTest = async () => {
    try {
      await schedulePushNotification(
        'Scheduled Notification',
        'This notification was scheduled for 5 seconds from now!',
        5,
        { screen: '/notifications' }
      );
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  const handleUpdateBadge = async () => {
    const currentBadge = await getBadgeCount();
    await setBadgeCount(currentBadge + 1);
  };

  const handleClearBadge = async () => {
    await setBadgeCount(0);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Push Notifications Demo
      </ThemedText>
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Push Token:</ThemedText>
        <ThemedText style={styles.token}>
          {pushToken ? `${pushToken.substring(0, 50)}...` : 'No token yet'}
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="Register for Push Notifications"
          onPress={handleRegister}
          variant="white"
        />
        
        <AppButton
          title="Send Test Notification"
          onPress={handleSendTest}
          variant="dark"
          disabled={!pushToken}
        />
        
        <AppButton
          title="Schedule Test (5s)"
          onPress={handleScheduleTest}
          variant="white"
        />
        
        <AppButton
          title="Update Badge (+1)"
          onPress={handleUpdateBadge}
          variant="dark"
        />
        
        <AppButton
          title="Clear Badge"
          onPress={handleClearBadge}
          variant="white"
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Instructions:</ThemedText>
        <ThemedText style={styles.instructions}>
          1. Register for push notifications{'\n'}
          2. Copy the push token to test with external services{'\n'}
          3. Send a test notification to yourself{'\n'}
          4. Schedule a notification for 5 seconds{'\n'}
          5. Test badge count functionality
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  token: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 8,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
