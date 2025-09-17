import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { useAppStore } from '@/store';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function DebugPanel() {
  const { debugFetchData, testApiConnection, userData, fetchData, fetchUnreadNotificationCount, unreadNotificationCount, setUnreadNotificationCount } = useAppStore();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Debug Panel</ThemedText>
      <ThemedText style={styles.currentData}>
        Current User: {userData.fullname} ({userData.email})
      </ThemedText>
      <ThemedText style={styles.currentData}>
        Notifications: {unreadNotificationCount}
      </ThemedText>
      
      <View style={styles.buttonContainer}>
        <AppButton
          title="🔬 Test API Calls"
          onPress={debugFetchData}
          style={styles.button}
        />
        
        <AppButton
          title="🔄 Regular Fetch"
          onPress={fetchData}
          style={styles.button}
        />
        
        <AppButton
          title="📬 Test Notifications"
          onPress={fetchUnreadNotificationCount}
          style={styles.button}
        />
        
        <AppButton
          title="🔔 Set Count to 5"
          onPress={() => setUnreadNotificationCount(5)}
          style={styles.button}
        />
      </View>
      
      <ThemedText style={styles.instruction}>
        Check console logs after pressing "Test API Calls"
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentData: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 12,
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: 'white',
  },
  instruction: {
    color: 'white',
    textAlign: 'center',
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
