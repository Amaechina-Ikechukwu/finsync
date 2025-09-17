import { auth } from '@/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  getAutoBiometricsEnabled,
  getBiometricsEnabled,
  getPasscodeLength,
  isPasscodeSet,
  migrateLegacyPlaintextPinIfNeeded,
  setBiometricsEnabled,
  setPasscode,
  verifyPasscode,
} from '@/utils/security';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNotification } from '../InAppNotificationProvider';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import AppButton from '../ui/AppButton';
import FSActivityLoader from '../ui/FSActivityLoader';
import Keypad from './Keypad';

export default function AppLock({ onUnlock, isSettingPin = false }: { onUnlock: () => void; isSettingPin?: boolean }) {
  const { showNotification } = useNotification();
  const bgColor = useThemeColor({}, 'background');
  const dotColor = useThemeColor({ light: '#222', dark: '#fff' }, 'text');

  const [step, setStep] = useState<'set' | 'confirm' | 'enter' | 'biometrics'>('set');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);
  const [isCheckingBiometrics, setIsCheckingBiometrics] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pinLength, setPinLength] = useState(4);

  // Debug step changes
  useEffect(() => {
    console.log('AppLock: Step changed to', step);
  }, [step]);

  const checkPinAndUnlock = async (pin: string) => {
    const res = await verifyPasscode(pin);
    if (res.success) {
      setPassword('');
      showNotification('Unlocked successfully', 'success');
      onUnlock();
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

  // Auto-check when entering PIN on the enter step
  useEffect(() => {
    if (step === 'enter' && password.length === pinLength) {
      checkPinAndUnlock(password);
    }
  }, [password, step, pinLength]);

  // Initialize step and biometrics capability
  useEffect(() => {
    (async () => {
      console.log('AppLock: Initializing', { isSettingPin });
      await migrateLegacyPlaintextPinIfNeeded();
      const isSet = await isPasscodeSet();
      const len = await getPasscodeLength();
      setPinLength(len);

      if (isSet && !isSettingPin) {
        const enabled = await getBiometricsEnabled();
        const autoEnabled = await getAutoBiometricsEnabled();
        const available = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const canUseBiometrics = enabled && available && enrolled;
        console.log('AppLock: Biometric status', { enabled, autoEnabled, available, enrolled, canUseBiometrics });
        setBiometricsEnabledState(canUseBiometrics);
        // Always go to PIN entry screen for app unlock, skip biometrics step
        console.log('AppLock: Setting step to enter for app unlock');
        setStep('enter');
      } else {
        console.log('AppLock: Setting step to set');
        setStep('set');
      }

      setIsInitializing(false);
      console.log('AppLock: Initialization complete');
    })();
  }, [isSettingPin]);

  const handleChange = (val: string) => {
    if (step === 'set') setPassword(val.slice(0, pinLength));
    else if (step === 'confirm') setConfirm(val.slice(0, pinLength));
    else if (step === 'enter') setPassword(val.slice(0, pinLength));
  };

  const handleSubmit = (val: string) => {
    if (step === 'enter') checkPinAndUnlock(val);
  };

  const handleLongDelete = () => {
    if (step === 'set') setPassword('');
    else if (step === 'confirm') setConfirm('');
    else setPassword('');
  };

  const handleContinue = async () => {
    if (step === 'set') {
      if (password.length !== pinLength) {
        showNotification(`PIN must be ${pinLength} digits`, 'error');
        return;
      }
      setStep('confirm');
    } else if (step === 'confirm') {
      if (password !== confirm) {
        showNotification('Passwords do not match', 'error');
        return;
      }
  await setPasscode(password);
  // Bind this PIN to the currently signed-in user so flows are per-account
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await SecureStore.setItemAsync('pinOwnerUid', uid);
    }
  } catch {}
  setPassword('');
  setConfirm('');
  // After setting a PIN during setup, move to biometrics step
  setStep('biometrics');
    } else if (step === 'enter') {
      await checkPinAndUnlock(password);
    }
  };

  const handleBiometrics = async () => {
    console.log('AppLock: handleBiometrics called', { isSettingPin, step });
    setIsCheckingBiometrics(true);
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      if (!available) {
        console.log('AppLock: No biometric hardware available');
        showNotification('No biometric hardware found', 'info');
        setIsCheckingBiometrics(false);
        if (isSettingPin) {
          await setBiometricsEnabled(false);
          console.log('AppLock: Calling onUnlock after no biometric hardware');
          return onUnlock();
        }
        return setStep('enter');
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.log('AppLock: No biometrics enrolled');
        showNotification('No biometrics enrolled', 'info');
        setIsCheckingBiometrics(false);
        if (isSettingPin) {
          await setBiometricsEnabled(false);
          console.log('AppLock: Calling onUnlock after no biometric enrollment');
          return onUnlock();
        }
        return setStep('enter');
      }

      console.log('AppLock: Starting biometric authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock with biometrics',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN instead',
      });

      console.log('AppLock: Biometric authentication result', result);

      if (result.success) {
        showNotification(isSettingPin ? 'Biometrics enabled' : 'Biometric authentication successful!', 'success');
        if (isSettingPin) {
          await setBiometricsEnabled(true);
        }
        setIsCheckingBiometrics(false);
        console.log('AppLock: Biometric success, calling onUnlock');
        // Add a small delay to ensure state updates are processed
        setTimeout(() => {
          onUnlock();
        }, 100);
      } else {
        console.log('AppLock: Biometric authentication failed or cancelled', result.error);
        setIsCheckingBiometrics(false);
        if (result.error === 'user_fallback' || result.error === 'user_cancel') {
          if (isSettingPin) {
            await setBiometricsEnabled(false);
            console.log('AppLock: User cancelled biometric setup, calling onUnlock');
            onUnlock();
            return;
          }
          setStep('enter');
        } else {
          showNotification('Biometric authentication failed', 'error');
          if (isSettingPin) {
            await setBiometricsEnabled(false);
            console.log('AppLock: Biometric setup failed, calling onUnlock');
            onUnlock();
            return;
          }
          setStep('enter');
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      showNotification('Biometric authentication error', 'error');
      setIsCheckingBiometrics(false);
      if (isSettingPin) {
        await setBiometricsEnabled(false);
        console.log('AppLock: Biometric error during setup, calling onUnlock');
        onUnlock();
        return;
      }
      setStep('enter');
    }
  };

  // Removed auto-trigger biometrics for unlock - now always go to PIN entry
  // Only keep biometrics auto-trigger during PIN setup

  // During PIN setup, auto-trigger biometrics setup after a delay
  useEffect(() => {
    if (step === 'biometrics' && isSettingPin && !isCheckingBiometrics) {
      console.log('AppLock: Auto-triggering biometrics setup during PIN setup');
      const timer = setTimeout(() => {
        handleBiometrics();
      }, 1000); // Slightly longer delay for setup
      return () => clearTimeout(timer);
    }
  }, [step, isSettingPin, isCheckingBiometrics]);

  // Safety fallback: if biometrics checking hangs too long, fall back to PIN
  useEffect(() => {
    if (step === 'biometrics' && isCheckingBiometrics) {
      console.log('AppLock: Starting biometric safety timeout');
      const safety = setTimeout(() => {
        // Give control back to the user
        console.log('AppLock: Biometric timeout reached, falling back to PIN');
        showNotification('Biometric prompt timed out, use PIN instead', 'info');
        setIsCheckingBiometrics(false);
        if (!isSettingPin) {
          setStep('enter');
        } else {
          // During setup, skip biometrics and continue
          setBiometricsEnabled(false);
          onUnlock();
        }
      }, 15000); // 15s safety timeout
      return () => clearTimeout(safety);
    }
  }, [step, isCheckingBiometrics, isSettingPin, showNotification, onUnlock]);

  if (isInitializing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <FSActivityLoader />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}> 
      <View style={styles.topSection}>
        {step === 'enter' ? (
          // Dedicated unlock screen
          <>
            <ThemedText type="title" style={styles.unlockTitle}>
              Welcome Back
            </ThemedText>
            <ThemedText style={styles.unlockSubtitle}>
              Enter your PIN to unlock Finsync
            </ThemedText>
            <View style={styles.dots}>
              {Array(password.length)
                .fill(0)
                .map((_, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: dotColor }]} />
                ))}
            </View>
          </>
        ) : (
          // Setup screens
          <>
            <ThemedText type="title" style={styles.title}>
              {step === 'set' && 'Keep Finsync Secured'}
              {step === 'confirm' && 'Almost there!'}
              {step === 'biometrics' && (isSettingPin ? 'Enable Biometrics\nfor quick access' : 'Unlock with biometrics or PIN')}
            </ThemedText>

            {(step === 'set' || step === 'confirm') && (
              <ThemedText style={styles.description}>Help keep your app secured by setting up your app password.</ThemedText>
            )}

            {/* Custom dot row for AppLock (we hide Keypad dots) */}
            <View style={styles.dots}>
              {Array(step === 'confirm' ? confirm.length : password.length)
                .fill(0)
                .map((_, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: dotColor }]} />
                ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        {(step === 'set' || step === 'confirm' || step === 'enter') && (
          <>
            <Keypad
              value={step === 'confirm' ? confirm : password}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onLongDelete={handleLongDelete}
              maxLength={pinLength}
              showPinDots={false}
              showBiometric={step === 'enter' && biometricsEnabled}
              onBiometricPress={step === 'enter' ? handleBiometrics : undefined}
            />

            <AppButton
              title="Continue"
              onPress={handleContinue}
              variant="white"
              disabled={(step === 'set' && password.length < pinLength) || (step === 'confirm' && confirm.length < pinLength) || (step === 'enter' && password.length < pinLength)}
            />
          </>
        )}

        {step === 'biometrics' && isCheckingBiometrics && (
          <View style={styles.loadingContainer}>
            <FSActivityLoader />
            <ThemedText style={styles.loadingText}>Checking biometrics...</ThemedText>
          </View>
        )}

        {step === 'biometrics' && !isSettingPin && !isCheckingBiometrics && (
          <View style={styles.biometricButtons}>
            <AppButton 
              title="Use Biometrics" 
              onPress={() => {
                console.log('AppLock: Manual biometric button pressed');
                handleBiometrics();
              }} 
              variant="white" 
              style={styles.biometricButton} 
            />
            <AppButton 
              title="Use PIN Instead" 
              onPress={() => {
                console.log('AppLock: Switching to PIN entry');
                setStep('enter');
              }} 
              variant="dark" 
              style={styles.biometricButton} 
            />
          </View>
        )}

        {step === 'biometrics' && isSettingPin && !isCheckingBiometrics && (
          <View style={styles.biometricButtons}>
            <AppButton title="Enable Biometrics" onPress={handleBiometrics} variant="white" style={styles.biometricButton} />
         
          </View>
        )}
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
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  unlockTitle: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 28,
    fontWeight: 'bold',
  },
  unlockSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    fontSize: 16,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
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
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  footer: {
    gap: 12,
  },
  biometricButtons: {
    marginTop: 16,
    gap: 12,
  },
  biometricButton: {
    marginVertical: 6,
  },
});
