import { auth } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { signOut } from 'firebase/auth';

/**
 * Comprehensive function to wipe all stored/persisted data
 * This includes:
 * - All SecureStore data (PIN, biometrics, onboarding, navigation, session)
 * - All AsyncStorage data (Zustand persisted state)
 * - Firebase auth session
 * - All app state will be reset to initial values
 */
export const wipeAllData = async (): Promise<void> => {
  try {
    // 1. Clear all SecureStore data
    const secureStoreKeys = [
      'seenOnboarding',
      // legacy + new security keys
      'appPin', 'appPinSalt', 'appPinHash', 'appPinLength', 'appPinAttempts', 'appPinLastFailTs',
      'biometricsEnabled', 'autoBiometricsEnabled',
      'session',
      'lastRoute',
      'shouldRestoreNavigation'
    ];
    
    const secureStorePromises = secureStoreKeys.map(async (key) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.warn(`⚠️ Failed to clear SecureStore key ${key}:`, error);
      }
    });
    
    await Promise.all(secureStorePromises);
    
    // 2. Clear all AsyncStorage data (including Zustand persisted state)
    await AsyncStorage.clear();
    
    // 3. Sign out from Firebase
    if (auth.currentUser) {
      await signOut(auth);
    }
    
  } catch (error) {
    console.error('❌ Error during data wipe:', error);
    throw error;
  }
};

/**
 * Wipe only user-specific data (keeps app preferences)
 * This is useful for signing out while keeping app settings
 */
export const wipeUserData = async (): Promise<void> => {
  try {
    // Clear user-specific SecureStore data
    const userSecureStoreKeys = [
      'appPin', 'appPinSalt', 'appPinHash', 'appPinLength', 'appPinAttempts', 'appPinLastFailTs',
      'session',
      'lastRoute',
      'shouldRestoreNavigation'
    ];
    
    const secureStorePromises = userSecureStoreKeys.map(async (key) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.warn(`⚠️ Failed to clear SecureStore key ${key}:`, error);
      }
    });
    
    await Promise.all(secureStorePromises);
    
    // Clear only the Zustand persisted state (not all AsyncStorage)
    await AsyncStorage.removeItem('app-storage-v3'); // The Zustand persist key
    
    // Sign out from Firebase
    if (auth.currentUser) {
      await signOut(auth);
    }
    
  } catch (error) {
    console.error('❌ Error during user data wipe:', error);
    throw error;
  }
};

/**
 * Reset only onboarding state (for testing onboarding flow)
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync('seenOnboarding');
  } catch (error) {
    console.error('❌ Error resetting onboarding:', error);
    throw error;
  }
};

/**
 * Reset app security settings (PIN and biometrics)
 */
export const resetSecuritySettings = async (): Promise<void> => {
  try {
  await SecureStore.deleteItemAsync('appPin');
  await SecureStore.deleteItemAsync('appPinSalt');
  await SecureStore.deleteItemAsync('appPinHash');
  await SecureStore.deleteItemAsync('appPinLength');
  await SecureStore.deleteItemAsync('appPinAttempts');
  await SecureStore.deleteItemAsync('appPinLastFailTs');
  await SecureStore.deleteItemAsync('biometricsEnabled');
  await SecureStore.deleteItemAsync('autoBiometricsEnabled');
  } catch (error) {
    console.error('❌ Error resetting security settings:', error);
    throw error;
  }
};
