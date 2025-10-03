import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { FirebaseNotificationsInitializer } from '@/components/FirebaseNotificationsInitializer';
import { InAppNotificationProvider } from '@/components/InAppNotificationProvider';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { auth } from '@/firebase';
import { SessionProvider } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { accountService } from '@/services/apiService';
import { getLastBackgroundTimestamp, getSessionUnlocked, isPasscodeSet, setLastBackgroundTimestamp, setSessionUnlocked } from '@/utils/security';
import * as Sentry from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
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
  const [initialDecisionDone, setInitialDecisionDone] = React.useState(false);
  const firstAuthHandledRef = React.useRef(false);
  const [minDelayPassed, setMinDelayPassed] = React.useState(false);
  const minDelayRef = React.useRef<number | null>(null);
  const appStateRef = React.useRef(AppState.currentState);
  const lastBackgroundTsRef = React.useRef<number | null>(null);

  // Inactivity threshold (ms) after which app unlock is required again
  // Centralized here but could be moved to a constants file if reused elsewhere.
  const INACTIVITY_LOCK_MS = 5 * 60 * 1000; // 5 minutes (configurable)

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

        // At cold start, if we have a last background timestamp, evaluate inactivity
        try {
          const lastBg = await getLastBackgroundTimestamp();
          if (lastBg) {
            const awayFor = Date.now() - lastBg;
            if (awayFor >= INACTIVITY_LOCK_MS) {
              await setSessionUnlocked(false);
              setHasUnlockedThisSession(false);
            }
          }
        } catch {}

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
          console.log('Auth state changed:', { user: !!firebaseUser, emailVerified: firebaseUser?.emailVerified });
          if (mounted) {
            setUser(firebaseUser);
            // Reset lock state when auth user changes
            setHasUnlockedThisSession(false);
            // Clear session unlock from storage when user changes
            await setSessionUnlocked(false);

            // If logged in, fetch profile to know BVN status
            if (firebaseUser) {
              try {
                const res = await accountService.getUserProfile();
                if (res?.success && res.data) {
                  const verified = !!(res.data as any).bvnVerified;
                  setIsBvnVerified(verified);
                  await SecureStore.setItemAsync('bvnVerified', verified ? 'true' : 'false');
                }
              } catch (e) {
                // Silent fallback to cached value
              }
            } else {
              setIsBvnVerified(false);
            }
            setIsLoading(false);
            // Mark that we've processed the initial auth state and related flags.
            if (!firstAuthHandledRef.current) {
              firstAuthHandledRef.current = true;
              setInitialDecisionDone(true);
              // enforce a short minimum loader time to avoid UI flashes
              setMinDelayPassed(false);
              if (minDelayRef.current) {
                clearTimeout(minDelayRef.current);
                minDelayRef.current = null;
              }
              minDelayRef.current = setTimeout(() => {
                setMinDelayPassed(true);
                minDelayRef.current = null;
              }, 300) as any as number;
            }
          }
        });
        
        return () => {
          unsubscribe();
          mounted = false;
        };
      } catch (e) {
        console.error('Auth initialization error:', e);
        console.log('Firebase config check:', {
          hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          hasAuthDomain: !!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          hasProjectId: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        });
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
          if (user) {
            const res = await accountService.getUserProfile();
            if (res?.success && res.data) {
              const verified = !!(res.data as any).bvnVerified;
              setIsBvnVerified(verified);
              await SecureStore.setItemAsync('bvnVerified', verified ? 'true' : 'false');
            } else {
              const bvnFlag = await SecureStore.getItemAsync('bvnVerified');
              setIsBvnVerified(bvnFlag === 'true');
            }
          } else {
            const bvnFlag = await SecureStore.getItemAsync('bvnVerified');
            setIsBvnVerified(bvnFlag === 'true');
          }
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

  // Enable navigation once auth ready (don't block on fonts)
  React.useEffect(() => {
    console.log('Navigation readiness check:', { loaded, isLoading, user: !!user, seenOnboarding, isPinSet, isBvnVerified });
    if (!isLoading) {
      console.log('Setting navigation ready to true');
      setNavigationReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, loaded]);

  // Main gating
  // IMPORTANT: hasUnlockedThisSession MUST be in the dependency array so that when
  // an inactivity lock resets it to false, we re-run and force navigation to the
  // unlock screen. Without it, the user could remain on a protected route.
  React.useEffect(() => {
    if (!navigationReady || isNavigating || !rootNav?.key) return;
    const currentRoute = segments.join('/') || '';
    console.log('Navigation gating check:', { currentRoute, user: !!user, seenOnboarding, isPinSet, isBvnVerified });

    // Highest priority: if user is signed in, PIN exists, but session not unlocked yet, force unlock screen
    if (user && isPinSet && !hasUnlockedThisSession && currentRoute !== 'auth/app-unlock') {
      console.log('Session locked: redirecting to app unlock before other gating');
      setIsNavigating(true);
      router.replace('/auth/app-unlock');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }

    if (user) {
      if (!user.emailVerified && currentRoute !== 'auth/verify-email') {
        console.log('Redirecting to email verification');
        setIsNavigating(true);
        router.replace('/auth/verify-email');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      const onBvnFlow = currentRoute === 'auth/bvn-entry' || currentRoute === 'auth/bvn-phone' || currentRoute === 'auth/bvn-otp';
      if (user.emailVerified && !isBvnVerified && !onBvnFlow) {
        console.log('Redirecting to BVN entry');
        setIsNavigating(true);
        router.replace('/auth/bvn-entry');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      if (user.emailVerified && isBvnVerified && !isPinSet && currentRoute !== 'auth/pin-setup') {
        console.log('Redirecting to PIN setup');
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
        console.log('Redirecting to main app (tabs)');
        setIsNavigating(true);
        router.replace('/(tabs)');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      if (isPinSet && !currentRoute) {
        console.log('No current route, redirecting to main app');
        setIsNavigating(true);
        router.replace('/(tabs)');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }
      return;
    }

    // Not signed in
    console.log('User not signed in, checking onboarding');
    if (!seenOnboarding) {
      if (currentRoute !== 'auth/onboarding' && currentRoute !== 'auth/login') {
        console.log('Redirecting to onboarding');
        setIsNavigating(true);
        router.replace('/auth/onboarding');
        setTimeout(() => setIsNavigating(false), 500);
      }
      return;
    }
    if (!currentRoute.startsWith('auth/')) {
      console.log('Redirecting to login');
      setIsNavigating(true);
      router.replace('/auth/login');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
  }, [navigationReady, isNavigating, rootNav?.key, segments, user, isBvnVerified, isPinSet, seenOnboarding, hasUnlockedThisSession]);

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

  // Sync unlock state when viewing the app-unlock screen (in case storage updated outside this component)
  React.useEffect(() => {
    if (!navigationReady) return;
    const currentRoute = segments.join('/') || '';
    if (currentRoute === 'auth/app-unlock' && !hasUnlockedThisSession) {
      (async () => {
        try {
          const unlocked = await getSessionUnlocked();
          if (unlocked) setHasUnlockedThisSession(true);
        } catch {}
      })();
    }
  }, [navigationReady, segments, hasUnlockedThisSession]);

  // App state / inactivity tracking: require unlock if backgrounded >= threshold
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      // When moving to background/inactive, record timestamp
      if ((nextState === 'background' || nextState === 'inactive') && (prev === 'active')) {
        const ts = Date.now();
        lastBackgroundTsRef.current = ts;
        // Persist so we can enforce after process death
        await setLastBackgroundTimestamp(ts);
      }
      // When coming back to active, check inactivity duration
      if (nextState === 'active' && (prev === 'background' || prev === 'inactive')) {
        if (lastBackgroundTsRef.current) {
          const awayFor = Date.now() - lastBackgroundTsRef.current;
          if (awayFor >= INACTIVITY_LOCK_MS) {
            try {
              // Force session lock so gating effect will redirect; also reset in-memory flag
              await setSessionUnlocked(false);
              setHasUnlockedThisSession(false);
              // Immediate navigation to unlock to avoid waiting for effect cycle
              const currentRoute = segments.join('/') || '';
              if (user && isPinSet && currentRoute !== 'auth/app-unlock') {
                setIsNavigating(true);
                router.replace('/auth/app-unlock');
                setTimeout(() => setIsNavigating(false), 500);
              }
            } catch {}
          }
        }
      }
    });
    return () => sub.remove();
  }, [user, isPinSet, segments]);

  if (!navigationReady || !rootNav?.key || !initialDecisionDone || !minDelayPassed) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff' }} edges={['left', 'right', 'bottom']}>
        <FSActivityLoader />
      </SafeAreaView>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        animation: 'fade_from_bottom',
        headerShown: false,
        // Hide iOS back button titles globally to avoid showing route group names like "(tabs)"
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerBackTitleStyle:{fontSize:12}
      }}>
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
        {/* Ensure the Tabs route doesn't contribute a back title */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
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
    // Ensure the app draws edge-to-edge with a transparent system UI background on Android
    SystemUI.setBackgroundColorAsync('transparent').catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        {/* Use status bar styles without setting explicit colors to avoid deprecated APIs */}
        <StatusBar translucent style="auto" />
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