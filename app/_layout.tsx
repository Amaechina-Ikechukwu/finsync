import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
  
  // Simple auth state
  const [user, setUser] = React.useState<User | null>(null);
  const [seenOnboarding, setSeenOnboarding] = React.useState(false);
  const [isPinSet, setIsPinSet] = React.useState(false);
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

  // Initialize auth state
  React.useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        // Check onboarding
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
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Re-check onboarding and PIN status when navigation occurs
  React.useEffect(() => {
    if (!navigationReady) return;
    
    const currentRoute = segments.join('/') || '';
    
    // Only re-check states when transitioning to/from specific routes
    if (currentRoute === 'auth/onboarding' || currentRoute === 'auth/login' || currentRoute === 'auth/pin-setup') {
      const recheckStates = async () => {
        // Re-check onboarding status
        const onboarded = await SecureStore.getItemAsync('seenOnboarding');
        const newOnboardingState = onboarded === 'true';
        
        console.log('Layout: Re-checking states', { 
          currentRoute, 
          oldOnboarding: seenOnboarding, 
          newOnboarding: newOnboardingState 
        });
        
        setSeenOnboarding(newOnboardingState);
        
        // Re-check PIN status if user exists (respect owner UID)
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
      };
      
      recheckStates();
    }
  }, [navigationReady, segments]);

  // Wait for fonts and initial auth check
  React.useEffect(() => {
    if (loaded && !isLoading) {
      setNavigationReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, isLoading]);

  // Handle navigation after state is ready
  React.useEffect(() => {
    if (!navigationReady || isNavigating || !rootNav?.key) return;
    
    const currentRoute = segments.join('/') || '';
    console.log('Navigation check:', { currentRoute, seenOnboarding, user: !!user, isPinSet });
    
    // Sequential flow with strict gating
    // 1) Onboarding must be completed first. When not completed, allow onboarding or login (to avoid bounce after pressing Skip/Get Started)
    if (!seenOnboarding) {
      if (currentRoute !== 'auth/onboarding' && currentRoute !== 'auth/login') {
        console.log('Redirecting to onboarding');
        setIsNavigating(true);
        router.replace('/auth/onboarding');
        setTimeout(() => setIsNavigating(false), 500);
      }
      return; // Do not process further redirects until onboarding is done
    }
    
    // 2) If onboarding is done but user not signed in, send to login
    if (!user && !currentRoute.startsWith('auth/')) {
      console.log('Redirecting to login');
      setIsNavigating(true);
      router.replace('/auth/login');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    
    // 3) After login, if no PIN bound for this user, go to PIN setup.
    if (user && !isPinSet && currentRoute !== 'auth/pin-setup') {
      console.log('Redirecting to pin setup');
      setIsNavigating(true);
      router.replace('/auth/pin-setup');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    
    // If PIN is set and we somehow remain on pin-setup, proceed to biometrics setup screen
    if (user && isPinSet && currentRoute === 'auth/pin-setup') {
      console.log('Redirecting to biometrics setup');
      setIsNavigating(true);
      router.replace('/auth/biometrics-setup');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    
  if (user && isPinSet && currentRoute.startsWith('auth/') && 
        currentRoute !== 'auth/biometrics-setup' && currentRoute !== 'auth/pin-setup' && currentRoute !== 'auth/app-unlock') {
      console.log('Redirecting to tabs from auth screen');
      setIsNavigating(true);
      router.replace('/(tabs)');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    
  if (user && isPinSet && !currentRoute) {
      console.log('Redirecting to tabs (default)');
      setIsNavigating(true);
      router.replace('/(tabs)');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
  }, [navigationReady, seenOnboarding, user, isPinSet, segments, router, isNavigating, rootNav?.key]);

  // While locked, navigate to app unlock screen
  React.useEffect(() => {
    if (!navigationReady || isNavigating) return;
    
    const currentRoute = segments.join('/') || '';
    const onAuthScreen = currentRoute.startsWith('auth/');
    
    if (user && isPinSet && !onAuthScreen && !hasUnlockedThisSession && currentRoute !== 'auth/app-unlock') {
      console.log('Redirecting to app unlock');
      setIsNavigating(true);
      router.replace('/auth/app-unlock');
      setTimeout(() => setIsNavigating(false), 500);
      return;
    }
    
    // Check if user has unlocked in another screen (like auth/app-unlock)
    if (user && isPinSet && currentRoute === 'auth/app-unlock') {
      checkSessionUnlock();
    }
  }, [navigationReady, user, isPinSet, hasUnlockedThisSession, segments, isNavigating]);

  // Monitor for session unlock changes
  React.useEffect(() => {
    if (!navigationReady || isNavigating) return;
    
    const currentRoute = segments.join('/') || '';
    
    // If we're on unlock screen and session is now unlocked, go to tabs
    if (hasUnlockedThisSession && currentRoute === 'auth/app-unlock') {
      console.log('Session unlocked, redirecting to tabs');
      setIsNavigating(true);
      router.replace('/(tabs)');
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [hasUnlockedThisSession, navigationReady, segments, isNavigating]);

  // Show loading while initializing (keep navigator mounted during redirects)
  if (!navigationReady || !rootNav?.key) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff' }} edges={['left', 'right', 'bottom']}>
        <FSActivityLoader />
      </SafeAreaView>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{animation: 'fade_from_bottom', headerShown: false}}>
        <Stack.Screen name="auth/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default Sentry.wrap(function RootLayout() {
  // Keep splash visible until app is ready
  React.useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  return (
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
  );
});