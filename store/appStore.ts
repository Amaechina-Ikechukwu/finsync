import { auth } from '@/firebase';
import { getBiometricsEnabled, isPasscodeSet, setBiometricsEnabled, setPasscode } from '@/utils/security';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged, User } from 'firebase/auth';
import { create } from 'zustand';

interface AppStore {
  // Auth state
  user: User | null;
  isAuthLoading: boolean;
  // App state
  seenOnboarding: boolean;
  isBvnVerified: boolean;
  isPinSet: boolean;
  isAppLoading: boolean;
  biometricsEnabled: boolean;
  // Navigation state
  lastRoute: string | null;
  shouldRestoreNavigation: boolean;
  // Actions
  setUser: (user: User | null) => void;
  setSeenOnboarding: (seen: boolean) => void;
  setBvnVerified: (verified: boolean) => void;
  setPinSet: (isSet: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  logCurrentIdToken: () => Promise<void>;
  // Navigation actions
  setLastRoute: (route: string) => void;
  setShouldRestoreNavigation: (should: boolean) => void;
  clearNavigationState: () => void;
  loadNavigationState: () => Promise<void>;
  saveNavigationState: (route: string) => Promise<void>;
  clearNavigationStateFromStorage: () => Promise<void>;
  // Async actions
  checkOnboardingStatus: () => Promise<void>;
  checkBvnVerificationStatus: () => Promise<void>;
  checkPinStatus: () => Promise<void>;
  checkBiometricsStatus: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  markBvnVerified: () => Promise<void>;
  setPinCode: (pin: string) => Promise<void>;
  enableBiometrics: () => Promise<void>;
  disableBiometrics: () => Promise<void>;
  resetAppState: () => void;
  initializeApp: () => Promise<void>;
  setupAppStateListener: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthLoading: true,
  seenOnboarding: false,
  isBvnVerified: false,
  isPinSet: false,
  isAppLoading: true,
  biometricsEnabled: false,
  
  // Navigation state
  lastRoute: null,
  shouldRestoreNavigation: false,
  // Basic setters
  setUser: (user) => set({ user, isAuthLoading: false }),
  setSeenOnboarding: (seen) => set({ seenOnboarding: seen }),
  setBvnVerified: (verified) => set({ isBvnVerified: verified }),
  setPinSet: (isSet) => set({ isPinSet: isSet }),
  setBiometricsEnabled: (enabled) => set({ biometricsEnabled: enabled }),

  // Log current ID token for debugging
  logCurrentIdToken: async () => {
    const { user } = get();
    if (user) {
      try {
        const idToken = await user.getIdToken(true); // Force refresh
        
        const tokenResult = await user.getIdTokenResult(true);
      } catch (error) {
        console.error('❌ Error getting current ID token:', error);
      }
    }
  },

  // Navigation setters
  setLastRoute: (route) => {
    set({ lastRoute: route });
  },
  setShouldRestoreNavigation: (should) => {
    set({ shouldRestoreNavigation: should });
  },  clearNavigationState: () => {
    set({ lastRoute: null, shouldRestoreNavigation: false });
    // Also clear from storage
    get().clearNavigationStateFromStorage();
  },

  // Check onboarding status
  checkOnboardingStatus: async () => {
    try {
      const value = await SecureStore.getItemAsync('seenOnboarding');
      set({ seenOnboarding: value === 'true' });
    } catch (error) {
      console.error('Error checking onboarding:', error);
      set({ seenOnboarding: false });
    }
  },

  // Check BVN verification status
  checkBvnVerificationStatus: async () => {
    try {
      const value = await SecureStore.getItemAsync('bvnVerified');
      set({ isBvnVerified: value === 'true' });
    } catch (error) {
      console.error('Error checking BVN verification:', error);
      set({ isBvnVerified: false });
    }
  },

  // Check PIN status
  checkPinStatus: async () => {
    try {
      const setFlag = await isPasscodeSet();
      set({ isPinSet: setFlag });
    } catch (error) {
      console.error('Error checking PIN:', error);
      set({ isPinSet: false });
    }
  },

  // Check biometrics status
  checkBiometricsStatus: async () => {
    try {
      const enabled = await getBiometricsEnabled();
      set({ biometricsEnabled: enabled });
    } catch (error) {
      console.error('Error checking biometrics:', error);
      set({ biometricsEnabled: false });
    }
  },

  // Mark onboarding as complete
  markOnboardingComplete: async () => {
    try {
      await SecureStore.setItemAsync('seenOnboarding', 'true');
      set({ seenOnboarding: true });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  // Mark BVN as verified
  markBvnVerified: async () => {
    try {
      await SecureStore.setItemAsync('bvnVerified', 'true');
      set({ isBvnVerified: true });
    } catch (error) {
      console.error('Error marking BVN verified:', error);
    }
  },

  // Set PIN code
  setPinCode: async (pin: string) => {
    try {
      await setPasscode(pin);
      set({ isPinSet: true });
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw error;
    }
  },

  // Enable biometrics
  enableBiometrics: async () => {
    try {
      await setBiometricsEnabled(true);
      set({ biometricsEnabled: true });
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      throw error;
    }
  },

  // Disable biometrics
  disableBiometrics: async () => {
    try {
      await setBiometricsEnabled(false);
      set({ biometricsEnabled: false });
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      throw error;
    }
  },

  // No-op unlock/lockApp: removed session-based re-locking
  // Reset app state (sign out)
  resetAppState: () => {
    set({
      user: null,
      seenOnboarding: false,
      isBvnVerified: false,
      isPinSet: false,
      lastRoute: null,
      shouldRestoreNavigation: false,
    });
    get().clearNavigationState();
  },
  // Initialize app - check all states
  initializeApp: async () => {
    set({ isAppLoading: true });

    // Set up auth listener
    onAuthStateChanged(auth, async (user) => {
      
      // Get and log ID token if user is authenticated
      if (user) {
        try {
          const idToken = await user.getIdToken();
          
          // Also log token claims for debugging
          const tokenResult = await user.getIdTokenResult();
        } catch (error) {
          console.error('❌ Error getting ID token:', error);
        }
      }
      
      set({ user, isAuthLoading: false });
    });    // Check onboarding, BVN, PIN, biometrics, and navigation state
    await Promise.all([
      get().checkOnboardingStatus(),
      get().checkBvnVerificationStatus(),
      get().checkPinStatus(),
      get().checkBiometricsStatus(),
      get().loadNavigationState(),
    ]);

    // No session-based re-locking on background

    set({ isAppLoading: false });
  },  // Setup app state listener for app termination detection
  setupAppStateListener: () => {
    // No-op: removed session-based re-locking
  },

  // Load navigation state from storage
  loadNavigationState: async () => {
    try {
      const savedRoute = await SecureStore.getItemAsync('lastRoute');
      const shouldRestore = await SecureStore.getItemAsync('shouldRestoreNavigation');
      
      
      if (savedRoute && shouldRestore === 'true') {
        set({ 
          lastRoute: savedRoute, 
          shouldRestoreNavigation: true 
        });
      }
    } catch (error) {
      console.error('Error loading navigation state:', error);
    }
  },

  // Save navigation state to storage
  saveNavigationState: async (route: string) => {
    try {
      await SecureStore.setItemAsync('lastRoute', route);
      await SecureStore.setItemAsync('shouldRestoreNavigation', 'true');
    } catch (error) {
      console.error('Error saving navigation state:', error);
    }
  },

  // Clear navigation state from storage
  clearNavigationStateFromStorage: async () => {
    try {
      await SecureStore.deleteItemAsync('lastRoute');
      await SecureStore.deleteItemAsync('shouldRestoreNavigation');
    } catch (error) {
      console.error('Error clearing navigation state from storage:', error);
    }
  },
}));
