import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { getBiometricsEnabled, setBiometricsEnabled } from '@/utils/security';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function BiometricsSetupScreen() {
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(false);
  const [biometricsType, setBiometricsType] = useState<string>('');
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const {showNotification} = useNotification();
  const router = useRouter();

  useEffect(() => {
    checkBiometricsAvailability();
  }, []);

  // If biometrics already enabled, immediately proceed to the app
  useEffect(() => {
    if (biometricsEnabled) {
      // Avoid showing any intermediate UI
      router.replace('/(tabs)');
    }
  }, [biometricsEnabled, router]);

  const checkBiometricsAvailability = async () => {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const enabled = await getBiometricsEnabled();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricsAvailable(available);
      setBiometricsEnrolled(enrolled);
      setBiometricsEnabledState(enabled);
      
      // Determine biometrics type
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricsType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricsType('Fingerprint');
      } else {
        setBiometricsType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
      showNotification('Error checking biometric support', 'error');
    }
  };

  const handleEnableBiometrics = async () => {
    if (!biometricsAvailable) {
      showNotification('Biometric authentication is not available on this device', 'error');
      return;
    }

    if (!biometricsEnrolled) {
      Alert.alert(
        'No Biometrics Enrolled',
        `Please set up ${biometricsType} in your device settings first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Test biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricsType} for Finsync`,
        disableDeviceFallback: false,
        fallbackLabel: 'Cancel'
      });

      if (result.success) {
        await setBiometricsEnabled(true);
        setBiometricsEnabledState(true);
        showNotification(`${biometricsType} enabled successfully!`, 'success');
        console.log('Biometrics enabled, navigating to tabs...');
        router.push('/(tabs)');
      } else {
        showNotification('Biometric authentication failed', 'error');
      }
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      showNotification('Failed to enable biometrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlenavigation = async () => {
    try {
      setLoading(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      showNotification('Failed to disable biometrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setBiometricsEnabledState(false);
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      
      
      <View style={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {biometricsType} Setup
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Use {biometricsType.toLowerCase()} to quickly unlock Finsync
        </ThemedText>
      </View>

        <View style={styles.iconContainer}>
          <ThemedText style={styles.biometricIcon}>
            {biometricsType === 'Face ID' ? '👤' : '👆'}
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          {biometricsAvailable && biometricsEnrolled ? (
            !biometricsEnabled ? (
              <AppButton
                title={`Enable ${biometricsType}`}
                onPress={handleEnableBiometrics}
                disabled={loading}
                style={styles.button}
              />
            ) : (
              <AppButton
                title="Continue"
                onPress={handlenavigation}
                disabled={loading}
                variant='white'
              />
            )
          ) : (
            <>
              <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>
                {biometricsAvailable ? `No ${biometricsType.toLowerCase()} enrolled on this device.` : 'Biometric authentication is not available on this device.'}
              </ThemedText>
             
            </>
          )}
         
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  biometricIcon: {
    fontSize: 80,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    width: '100%' as const,
    borderRadius: 20,
  },
  disableButton: {
    width: '100%' as const,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
  },
  skipButton: {
    width: '100%' as const,
    borderRadius: 20,
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#666',
  },
  skipButtonText: {
    color: '#666',
  },
});
