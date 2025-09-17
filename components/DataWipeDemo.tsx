import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import {
    resetOnboarding,
    resetSecuritySettings,
    wipeAllData,
    wipeUserData
} from '@/utils/dataWipe';
import React from 'react';
import { Alert, View } from 'react-native';

/**
 * Data Wipe Demo Component
 * 
 * This component provides buttons to test different data wipe functions.
 * It's intended for development/testing purposes.
 * 
 * Usage:
 * Import and add this component to any screen for testing:
 * ```tsx
 * import DataWipeDemo from '@/components/DataWipeDemo';
 * 
 * // In your component:
 * <DataWipeDemo />
 * ```
 */
export default function DataWipeDemo() {
  const handleWipeAllData = async () => {
    Alert.alert(
      'Wipe All Data',
      'This will completely reset the app to its initial state. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe All',
          style: 'destructive',
          onPress: async () => {
            try {
              await wipeAllData();
              Alert.alert('Success', 'All data wiped successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to wipe data');
            }
          }
        }
      ]
    );
  };

  const handleWipeUserData = async () => {
    Alert.alert(
      'Wipe User Data',
      'This will sign out the user and clear user data, but keep app preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe User Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await wipeUserData();
              Alert.alert('Success', 'User data wiped successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to wipe user data');
            }
          }
        }
      ]
    );
  };

  const handleResetOnboarding = async () => {
    try {
      await resetOnboarding();
      Alert.alert('Success', 'Onboarding reset successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset onboarding');
    }
  };

  const handleResetSecurity = async () => {
    Alert.alert(
      'Reset Security Settings',
      'This will clear PIN and biometrics settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Security',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSecuritySettings();
              Alert.alert('Success', 'Security settings reset successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset security settings');
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={{ padding: 20 }}>
      <ThemedText type="title" style={{ marginBottom: 20, textAlign: 'center' }}>
        Data Wipe Demo
      </ThemedText>
      
      <ThemedText style={{ marginBottom: 20, textAlign: 'center' }}>
        Test data wipe functions (Development/Testing Only)
      </ThemedText>

      <View style={{ gap: 15 }}>
        <AppButton
          title="Wipe All Data"
          onPress={handleWipeAllData}
          style={{ backgroundColor: '#dc2626' }}
        />
        
        <AppButton
          title="Wipe User Data Only"
          onPress={handleWipeUserData}
          style={{ backgroundColor: '#ea580c' }}
        />
        
        <AppButton
          title="Reset Onboarding"
          onPress={handleResetOnboarding}
          style={{ backgroundColor: '#0ea5e9' }}
        />
        
        <AppButton
          title="Reset Security Settings"
          onPress={handleResetSecurity}
          style={{ backgroundColor: '#8b5cf6' }}
        />
      </View>
      
      <ThemedText style={{ marginTop: 20, fontSize: 12, textAlign: 'center', opacity: 0.7 }}>
        These functions will clear stored data and may require app restart.
      </ThemedText>
    </ThemedView>
  );
}
