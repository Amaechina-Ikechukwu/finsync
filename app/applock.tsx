import AppLock from '@/components/security/AppLock';

import { useNotification } from '@/components/InAppNotificationProvider';
import { useSession } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

export default function App({ children }: { children: React.ReactNode }) {
  const { isPinSet, session, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const bgColor = useThemeColor({}, 'background');  const [unlocked, setUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  // Removed session-based re-locking
  const [biometricsEnabled, setBiometricsEnabled] = useState<string | null>(null);
    // Don't show AppLock if user is on authentication-related screens
  const isOnAuthScreen = ['/pin-setup', '/login', '/signup', '/auth/onboarding', '/forgot-password'].includes(pathname);
  const {showNotification} = useNotification()
  const handleUnlock = () => {
    showNotification("Logging in","success")
    setUnlocked(true);
    setHasUnlockedThisSession(true);
    // Don't force navigation here - let _layout.tsx handle it
    // This prevents navigation conflicts
  };

  // Load biometrics setting on mount
  useEffect(() => {
    const loadBiometricsSetting = async () => {
      try {
        const biometricsEnabledValue = await SecureStore.getItemAsync('biometricsEnabled');
        setBiometricsEnabled(biometricsEnabledValue);
      } catch (error) {
        console.error('Error loading biometrics setting:', error);
        setBiometricsEnabled('false');
      }
    };
  useEffect(() => {
    // Show loading while auth state is being determined or biometrics setting is loading
    if (isLoading || biometricsEnabled === null) {
      setCheckingAuth(true);
      setUnlocked(false);
      return;
    }

    // If user is on auth screens, unlock immediately
    if (isOnAuthScreen) {
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // If no session, unlock (let main layout handle navigation)
    if (!session) {
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // If user has session but no PIN is set, unlock (they need to set up PIN)
    if (!isPinSet) {
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // User has PIN and session, start locked
    setUnlocked(false);
    setCheckingAuth(false);
  }, [isPinSet, session, isOnAuthScreen, isLoading, biometricsEnabled]);
  }, [isPinSet, session, isOnAuthScreen, isLoading, hasUnlockedThisSession, biometricsEnabled]);


    return <AppLock onUnlock={handleUnlock} />;
  
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
