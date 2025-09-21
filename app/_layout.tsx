import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { FirebaseNotificationsInitializer } from '@/components/FirebaseNotificationsInitializer';
import { InAppNotificationProvider } from '@/components/InAppNotificationProvider';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { auth } from '@/firebase';
import { SessionProvider } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getSessionUnlocked, isPasscodeSet, setSessionUnlocked } from '@/utils/security';
import * as Sentry from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

Sentry.init({
  dsn: 'https://f4a2ac353deb0e0df0a1202f983c3edf@o4507437373980672.ingest.de.sentry.io/4509849441927248',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function AuthNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const rootNav = useRootNavigationState();

  const [user, setUser] = React.useState<User | null>(null);
  const [seenOnboarding, setSeenOnboarding] = React.useState(false);
  const [isPinSet, setIsPinSet] = React.useState(false);
  const [isBvnVerified, setIsBvnVerified] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [navigationReady, setNavigationReady] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [hasUnlockedThisSession, setHasUnlockedThisSession] = React.useState(false);

  // Check session unlock status from persistent storage
  const checkSessionUnlock = async () => {
    const unlocked = await getSessionUnlocked();
    setHasUnlockedThisSession(unlocked);
    return unlocked;
  };
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Belgrano: require('../assets/fonts/Belgrano-Regular.ttf'),
  });

  // Initialize flags and auth
  React.useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const onboarded = await SecureStore.getItemAsync('seenOnboarding');

        // Check session unlock state
        await checkSessionUnlock();

        // Check PIN for current user (PINs are device-stored; bind to user via owner UID)
        const pinSet = await isPasscodeSet();
        let pinForUser = false;
        try {
          const owner = await SecureStore.getItemAsync('pinOwnerUid');
          const uid = auth.currentUser?.uid ?? null;
          pinForUser = !!uid && !!owner && owner === uid;
        } catch {}
        if (mounted) setIsPinSet(pinSet && pinForUser);

        // Check BVN verification flag
        try {
          const bvnFlag = await SecureStore.getItemAsync('bvnVerified');
          if (mounted) setIsBvnVerified(bvnFlag === 'true');
        } catch {}

        // If a PIN is set for this user, consider onboarding complete automatically
        if (mounted) {
          if (pinSet && pinForUser) {
            if (onboarded !== 'true') {
              await SecureStore.setItemAsync('seenOnboarding', 'true');
            }
            setSeenOnboarding(true);
          } else {
            setSeenOnboarding(onboarded === 'true');
          }
        }
        
        // Setup auth listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (mounted) {
            setUser(firebaseUser);
            setIsLoading(false);
      // Reset lock state when auth user changes
      setHasUnlockedThisSession(false);
      // Clear session unlock from storage when user changes
      await setSessionUnlocked(false);
          }
        });
        
        return () => {
          unsubscribe();
          mounted = false;
        };
      } catch (e) {
        console.error('Auth initialization error:', e);
        if (mounted) setIsLoading(false);
      }
    };
    init();
  }, []);

  // Re-check stored flags when visiting key auth routes
  React.useEffect(() => {
    if (!navigationReady) return;
    const currentRoute = segments.join('/') || '';
    if (
      currentRoute === 'auth/onboarding' ||
      currentRoute === 'auth/login' ||
      currentRoute === 'auth/pin-setup' ||
      currentRoute.startsWith('auth/bvn-')
    ) {
      (async () => {
        const onboarded = await SecureStore.getItemAsync('seenOnboarding');
        setSeenOnboarding(onboarded === 'true');
        try {
          const bvnFlag = await SecureStore.getItemAsync('bvnVerified');
          setIsBvnVerified(bvnFlag === 'true');
        } catch {}
        if (user) {
          const pinSet = await isPasscodeSet();
          let pinForUser = false;
          try {
            const owner = await SecureStore.getItemAsync('pinOwnerUid');
            const uid = auth.currentUser?.uid ?? null;
            pinForUser = !!uid && !!owner && owner === uid;
          } catch {}
          setIsPinSet(pinSet && pinForUser);
        }
      })();
    }
  }, [navigationReady, segments]);

  // Enable navigation once fonts/auth ready
  React.useEffect(() => {
    if (loaded && !isLoading) {
      setNavigationReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, isLoading]);

  // Main gating
  React.useEffect(() => {
    if (!navigationReady || isNavigating || !rootNav?.key) return;
    const currentRoute = segments.join('/') || '';

    if (user) {
      if (!user.emailVerified && currentRoute !== 'auth/verify-email') {
        setIsNavigating(true);
        router.replace('/auth/verify-email');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      const onBvnFlow = currentRoute === 'auth/bvn-entry' || currentRoute === 'auth/bvn-phone' || currentRoute === 'auth/bvn-otp';
      if (user.emailVerified && !isBvnVerified && !onBvnFlow) {
        setIsNavigating(true);
        router.replace('/auth/bvn-entry');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      if (user.emailVerified && isBvnVerified && !isPinSet && currentRoute !== 'auth/pin-setup') {
        setIsNavigating(true);
        router.replace('/auth/pin-setup');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      if (
        isPinSet &&
        currentRoute.startsWith('auth/') &&
        currentRoute !== 'auth/biometrics-setup' &&
        currentRoute !== 'auth/app-unlock'
      ) {
        setIsNavigating(true);
        router.replace('/(tabs)');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      if (isPinSet && !currentRoute) {
        setIsNavigating(true);
        router.replace('/(tabs)');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      return;
    }

    // Not signed in
    if (!seenOnboarding) {
      if (currentRoute !== 'auth/onboarding' && currentRoute !== 'auth/login') {
        setIsNavigating(true);
        router.replace('/auth/onboarding');
        setTimeout(() => setIsNavigating(false), 500);
      }
      return;
    }
    if (!currentRoute.startsWith('auth/')) {
      setIsNavigating(true);
      router.replace('/auth/login');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
  }, [navigationReady, isNavigating, rootNav?.key, segments, user, isBvnVerified, isPinSet, seenOnboarding]);

  // Existing user lock screen
  React.useEffect(() => {
    if (!navigationReady || isNavigating) return;
    const currentRoute = segments.join('/') || '';
    const onAuthScreen = currentRoute.startsWith('auth/');
    if (user && isPinSet && !onAuthScreen && !hasUnlockedThisSession && currentRoute !== 'auth/app-unlock') {
      setIsNavigating(true);
      router.replace('/auth/app-unlock');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    if (user && isPinSet && currentRoute === 'auth/app-unlock') {
      checkSessionUnlock();
    }
  }, [navigationReady, isNavigating, segments, user, isPinSet, hasUnlockedThisSession]);

  // After unlock, go to tabs
  React.useEffect(() => {
    if (!navigationReady || isNavigating) return;
    const currentRoute = segments.join('/') || '';
    if (hasUnlockedThisSession && currentRoute === 'auth/app-unlock') {
      setIsNavigating(true);
      router.replace('/(tabs)');
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [hasUnlockedThisSession, navigationReady, isNavigating, segments]);

  if (!navigationReady || !rootNav?.key) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff' }} edges={['left', 'right', 'bottom']}>
        <FSActivityLoader />
      </SafeAreaView>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ animation: 'fade_from_bottom', headerShown: false }}>
        <Stack.Screen name="auth/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="auth/bvn-entry" options={{ headerShown: false }} />
        <Stack.Screen name="auth/bvn-phone" options={{ headerShown: false }} />
        <Stack.Screen name="auth/bvn-otp" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="auth/pin-setup" options={{ headerShown: false }} />
        <Stack.Screen name="auth/biometrics-setup" options={{ headerShown: false }} />
        <Stack.Screen name="auth/app-unlock" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {isNavigating && (
        <SafeAreaView style={{ position: 'absolute', inset: 0 as any, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff' }} edges={['left', 'right', 'bottom']}>
          <FSActivityLoader />
        </SafeAreaView>
      )}
    </ThemeProvider>
  );
}

export default Sentry.wrap(function RootLayout() {
  React.useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <InAppNotificationProvider>
            <SessionProvider>
              <FirebaseNotificationsInitializer />
              <AuthNavigator />
            </SessionProvider>
          </InAppNotificationProvider>
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
});