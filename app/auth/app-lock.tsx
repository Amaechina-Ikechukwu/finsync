import { useNotification } from '@/components/InAppNotificationProvider';
import Keypad from '@/components/security/Keypad';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import HomeSkeleton from '@/components/ui/HomeSkeleton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppStore as useDataStore } from '@/store';
import { useAppStore } from '@/store/appStore';
import { verifyPasscode } from '@/utils/security';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function AppLockScreen() {
  const [pin, setPin] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const { biometricsEnabled } = useAppStore();
  const { fetchData } = useDataStore();
  const { showNotification} = useNotification();

  useEffect(() => {
    checkBiometricsAndTryAuth();
  }, []);
  const checkBiometricsAndTryAuth = async () => {
    try {
      if (biometricsEnabled) {
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (available && enrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Finsync',
            disableDeviceFallback: false,
            fallbackLabel: 'Use PIN instead'
      });
      if (result.success) {
            showNotification('Biometric authentication successful', 'success');
            setIsLoadingData(true);
            // unlockApp removed: no session-based re-locking
            await fetchData();
            setIsLoadingData(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
  };

  const handlePinComplete = async (enteredPin: string) => {
    setIsUnlocking(true);
    try {
    const res = await verifyPasscode(enteredPin);
    if (res.success) {
        showNotification('PIN verified successfully', 'success');
        setIsUnlocking(false);
        setIsLoadingData(true);
        
        // unlockApp removed: no session-based re-locking
        
        // Fetch user data
        await fetchData();
        
        setIsLoadingData(false);
      } else {
        showNotification('Incorrect PIN. Please try again', 'error');
        setPin('');
        setIsUnlocking(false);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      showNotification('Failed to verify PIN', 'error');
      setIsUnlocking(false);
    }
  };

  const handlePinChange = (newPin: string) => {
    setPin(newPin);
    if (newPin.length === 4) {
      handlePinComplete(newPin);
    }
  };
  if (isUnlocking) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <FSActivityLoader />
        <ThemedText style={{ marginTop: 16 }}>Unlocking...</ThemedText>
      </ThemedView>
    );
  }

  if (isLoadingData) {
    return <HomeSkeleton />;
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 50 }}>
        <ThemedText type="title" style={{ marginBottom: 10 }}>
          Welcome Back
        </ThemedText>
        <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>
          Enter your PIN to unlock Finsync
        </ThemedText>
      </View>

      <Keypad
        value={pin}
        onChange={handlePinChange}
        showBiometric={biometricsEnabled}
        onBiometricPress={checkBiometricsAndTryAuth}
      />
      
    
    </ThemedView>
  );
}
