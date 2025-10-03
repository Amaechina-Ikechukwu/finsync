import { auth } from '@/firebase';
import { getBiometricsEnabled, isPasscodeSet, setBiometricsEnabled, setPasscode, verifyPasscode } from '@/utils/security';
import * as SecureStore from 'expo-secure-store';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import React from 'react';
import { useStorageState } from './useStorageState';

type AuthContextShape = {
  // Auth
  user: User | null;
  session: string | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // Onboarding
  seenOnboarding: boolean;
  markOnboardingComplete: () => Promise<void>;
  // Security
  isPinSet: boolean;
  biometricsEnabled: boolean;
  setPin: (pin: string) => Promise<void>;
  refreshPinStatus: () => Promise<void>;
  enableBiometrics: () => Promise<void>;
  disableBiometrics: () => Promise<void>;
  checkPin: (pin: string) => Promise<boolean>;
};

const AuthContext = React.createContext<AuthContextShape | null>(null);

export function useSession() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[sessionLoading, session], setSession] = useStorageState('session');
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [seenOnboarding, setSeenOnboarding] = React.useState(false);
  const [loadingOnboarding, setLoadingOnboarding] = React.useState(true);

  const [isPinSet, setIsPinSet] = React.useState(false);
  const [loadingPin, setLoadingPin] = React.useState(true);

  const [biometricsEnabled, setBiometricsEnabledState] = React.useState(false);
  const [loadingBiometrics, setLoadingBiometrics] = React.useState(true);

  // Load onboarding flag once
  React.useEffect(() => {
    (async () => {
      try {
        const v = await SecureStore.getItemAsync('seenOnboarding');
        setSeenOnboarding(v === 'true');
      } finally {
        setLoadingOnboarding(false);
      }
    })();
  }, []);

  // Auth listener
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const idToken = await u.getIdToken();
          setSession(idToken);
        } catch (e) {
          console.error('Error getting ID token:', e);
          setSession(null);
        }
      } else {
        setSession(null);
      }
    });
    return unsub;
  }, [setSession]);

  // Refresh PIN status whenever session changes
  const refreshPinStatus = React.useCallback(async () => {
    const set = await isPasscodeSet();
    setIsPinSet(set);
  }, []);

  // Refresh PIN status whenever the authenticated session changes.
  // Important: we explicitly toggle loadingPin back to true so that navigation
  // gates don't prematurely assume the PIN is not set and redirect the user to
  // the PIN setup screen before we finish reading SecureStore.
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingPin(true); // re-enter loading state for fresh session
      try {
        await refreshPinStatus();
      } finally {
        if (!cancelled) setLoadingPin(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [session, refreshPinStatus]);

  // Load biometrics enabled flag
  const refreshBiometrics = React.useCallback(async () => {
    const enabled = await getBiometricsEnabled();
    setBiometricsEnabledState(enabled);
  }, []);

  React.useEffect(() => {
    (async () => {
      await refreshBiometrics();
      setLoadingBiometrics(false);
    })();
  }, [session, refreshBiometrics]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser(cred.user);
    const idToken = await cred.user.getIdToken();
    setSession(idToken);
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    setUser(cred.user);
    const idToken = await cred.user.getIdToken();
    setSession(idToken);
  };

  const signOut = async () => {
    // Sign out of Firebase but intentionally DO NOT clear the stored app passcode.
    // Requirement: logging out should not clear the app code so user doesn't need to re-create it.
    await firebaseSignOut(auth);
    setSession(null);
    setUser(null);
    // Mark in-memory flag false for current (now signed-out) context so auth flows don't assume a PIN for unauthenticated user.
    setIsPinSet(false);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    await sendPasswordResetEmail(auth, email);
  };

  const markOnboardingComplete = async () => {
    await SecureStore.setItemAsync('seenOnboarding', 'true');
    setSeenOnboarding(true);
  };

  const setPin = async (pin: string) => {
    await setPasscode(pin);
    setIsPinSet(true);
  };

  const enableBiometrics = async () => {
    await setBiometricsEnabled(true);
    setBiometricsEnabledState(true);
  };

  const disableBiometrics = async () => {
    await setBiometricsEnabled(false);
    setBiometricsEnabledState(false);
  };

  const checkPin = async (pin: string) => {
    const res = await verifyPasscode(pin);
    return res.success;
  };

  const isLoading = sessionLoading || loadingOnboarding || loadingPin || loadingBiometrics;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        seenOnboarding,
        markOnboardingComplete,
        isPinSet,
        biometricsEnabled,
        setPin,
        refreshPinStatus,
        enableBiometrics,
        disableBiometrics,
        checkPin,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
