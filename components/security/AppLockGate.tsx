import AppLock from '@/components/security/AppLock';
import { useSession } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNotification } from '../InAppNotificationProvider';
import { ThemedView } from '../ThemedView';
import FSActivityLoader from '../ui/FSActivityLoader';

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const { isPinSet, session, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const bgColor = useThemeColor({}, 'background');

  const [unlocked, setUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasUnlockedThisSession, setHasUnlockedThisSession] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (checkingAuth) {
        console.log('AppLockGate: Safety timeout triggered, forcing unlock');
        setCheckingAuth(false);
        setUnlocked(true);
      }
    }, 5000); // 5 second safety timeout

    return () => clearTimeout(timeout);
  }, [checkingAuth]);

  // Don't show AppLock if user is on authentication-related screens
  const isOnAuthScreen = [
    '/auth/pin-setup',
    '/auth/login',
    '/auth/signup',
    '/auth/onboarding',
    '/auth/forgot-password',
    '/auth/bvn-entry',
    '/auth/bvn-phone',
    '/auth/bvn-otp',
    '/auth/biometrics-setup',
    '/auth/app-lock',
  ].includes(pathname);

  // Check if user is on main app screens (tabs)
  const isOnMainApp = pathname.startsWith('/(tabs)') || pathname === '/(tabs)';

  const { showNotification } = useNotification();

  const handleUnlock = () => {
    console.log('AppLockGate: Handling unlock');
    showNotification('Logging in', 'success');
    setUnlocked(true);
    setHasUnlockedThisSession(true);
    // Force a re-render to ensure state updates are applied
    setTimeout(() => {
      setCheckingAuth(false);
    }, 50);
  };

  // Gate app lock based on session and PIN only
  useEffect(() => {
    console.log('AppLockGate: Effect triggered', { 
      isLoading, 
      isOnAuthScreen, 
      isOnMainApp, 
      session: !!session, 
      isPinSet, 
      hasUnlockedThisSession,
      pathname 
    });

    // Show loading while auth state is being determined
    if (isLoading) {
      setCheckingAuth(true);
      if (!hasUnlockedThisSession) setUnlocked(false);
      return;
    }

    // If user is on auth screens, unlock immediately
    if (isOnAuthScreen) {
      console.log('AppLockGate: On auth screen, unlocking');
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // If user is on main app and has session + PIN, but hasn't unlocked this session,
    // automatically unlock them (they came from auth flow)
    if (isOnMainApp && session && isPinSet && !hasUnlockedThisSession) {
      console.log('Auto-unlocking user who navigated from auth to main app');
      setUnlocked(true);
      setHasUnlockedThisSession(true);
      setCheckingAuth(false);
      return;
    }

    // If no session, unlock (let main layout handle navigation)
    if (!session) {
      console.log('AppLockGate: No session, unlocking');
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // If user has session but no PIN is set, unlock (they need to set up PIN)
    if (!isPinSet) {
      console.log('AppLockGate: No PIN set, unlocking');
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // If we've already unlocked this session, stay unlocked
    if (hasUnlockedThisSession) {
      console.log('AppLockGate: Already unlocked this session');
      setUnlocked(true);
      setCheckingAuth(false);
      return;
    }

    // User has PIN and session, start locked
    console.log('AppLockGate: User needs to unlock');
    setUnlocked(false);
    setCheckingAuth(false);
  }, [isPinSet, session, isOnAuthScreen, isOnMainApp, isLoading, hasUnlockedThisSession, pathname]);

  if (isLoading || checkingAuth) {
    console.log('AppLockGate: Showing loading screen', { isLoading, checkingAuth });
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <FSActivityLoader />
      </ThemedView>
    );
  }

  // Show AppLock if user needs to unlock (has PIN, has session, not on auth screen, not unlocked)
  if (!unlocked && isPinSet && session && !isOnAuthScreen) {
    console.log('AppLockGate: Showing AppLock');
    return <AppLock onUnlock={handleUnlock} />;
  }

  console.log('AppLockGate: Rendering children');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
