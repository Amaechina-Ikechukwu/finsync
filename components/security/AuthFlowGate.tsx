import { useSession } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ThemedView } from '../ThemedView';
import FSActivityLoader from '../ui/FSActivityLoader';

export default function AuthFlowGate({ children }: { children: React.ReactNode }) {
  const { isLoading, seenOnboarding, user, isPinSet } = useSession();
  const router = useRouter();
  const segments = useSegments();
  const bgColor = useThemeColor({}, 'background');

  // Hide native splash when provider finished loading
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => {});
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments.join('/') || '';

    // 0) Onboarding first
    if (!seenOnboarding) {
      if (currentRoute !== 'auth/onboarding') router.replace('/auth/onboarding');
      return;
    }

    // 1) Auth
    if (!user) {
      if (!['auth/login', 'auth/signup', 'auth/forgot-password'].includes(currentRoute)) {
        router.replace('/auth/login');
      }
      return;
    }

    // 2) PIN setup (app code setup)
    if (!isPinSet) {
      if (currentRoute !== 'auth/pin-setup') router.replace('/auth/pin-setup');
      return;
    }

    // 3) Biometrics setup after PIN is set
    if (isPinSet && currentRoute !== 'auth/biometrics-setup' && [
      'auth/pin-setup'
    ].includes(currentRoute)) {
      router.replace('/auth/biometrics-setup');
      return;
    }

    // 4) Main app if stuck on auth screens
    if ([
      'auth/login',
      'auth/signup',
      'auth/forgot-password',
      'auth/pin-setup',
      'auth/onboarding',
      'auth/biometrics-setup',
    ].includes(currentRoute)) {
      router.replace('/(tabs)');
      return;
    }

    // 4) Default to tabs
    if (!currentRoute) router.replace('/(tabs)');
  }, [isLoading, seenOnboarding, user, isPinSet, segments, router]);

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor }}>
        <FSActivityLoader />
      </ThemedView>
    );
  }

  return <>{children}</>;
}
