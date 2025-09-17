import { useNotification } from '@/components/InAppNotificationProvider';
import Keypad from '@/components/security/Keypad';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getBiometricsEnabled, getPasscodeLength, setSessionUnlocked, verifyPasscode } from '@/utils/security';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function AppUnlockScreen() {
  const { showNotification } = useNotification();
  const router = useRouter();
  const bgColor = useThemeColor({}, 'background');
  const dotColor = useThemeColor({ light: '#222', dark: '#fff' }, 'text');

  const [password, setPassword] = useState('');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [pinLength, setPinLength] = useState(4);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const len = await getPasscodeLength();
        setPinLength(len);
        
        const enabled = await getBiometricsEnabled();
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const canUseBiometrics = enabled && available && enrolled;
        setBiometricsEnabled(canUseBiometrics);
      } catch (error) {
        console.error('Error initializing unlock screen:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const checkPinAndUnlock = async (pin: string) => {
    const res = await verifyPasscode(pin);
    if (res.success) {
      setPassword('');
      // Set session as unlocked
      await setSessionUnlocked(true);
      showNotification('Unlocked successfully', 'success');
  // Immediately navigate to main tabs so layout doesn't need to poll storage
  router.replace('/(tabs)');
    } else {
      setPassword('');
      if (res.remainingCooldownMs > 0) {
        const secs = Math.ceil(res.remainingCooldownMs / 1000);
        showNotification(`Too many attempts. Try again in ${secs}s`, 'error');
      } else {
        showNotification('Incorrect passcode', 'error');
      }
    }
  };

  const handleBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Finsync',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN instead',
      });

      if (result.success) {
        // Set session as unlocked
        await setSessionUnlocked(true);
        showNotification('Biometric authentication successful!', 'success');
  // Immediately navigate to main tabs so layout doesn't need to poll storage
  router.replace('/(tabs)');
      } else {
        showNotification('Biometric authentication failed', 'error');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      showNotification('Biometric authentication error', 'error');
    }
  };

  // Auto-check when entering PIN
  useEffect(() => {
    if (password.length === pinLength) {
      checkPinAndUnlock(password);
    }
  }, [password, pinLength]);

  const handleChange = (val: string) => {
    setPassword(val.slice(0, pinLength));
  };

  const handleSubmit = (val: string) => {
    checkPinAndUnlock(val);
  };

  const handleLongDelete = () => {
    setPassword('');
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.topSection}>
        <ThemedText type="title" style={styles.title}>
          Welcome Back
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter your PIN to unlock Finsync
        </ThemedText>
        
        <View style={styles.dots}>
          {Array(password.length)
            .fill(0)
            .map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: dotColor }]} />
            ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Keypad
          value={password}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onLongDelete={handleLongDelete}
          maxLength={pinLength}
          showPinDots={false}
          showBiometric={biometricsEnabled}
          onBiometricPress={biometricsEnabled ? handleBiometrics : undefined}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topSection: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
    marginBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  footer: {
    gap: 12,
  },
});
