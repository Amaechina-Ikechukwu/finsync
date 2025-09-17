import {
    resetOnboarding,
    resetSecuritySettings,
    wipeAllData,
    wipeUserData
} from '@/utils/dataWipe';
import React from 'react';

// Re-export the utility functions for backwards compatibility
export { resetOnboarding, resetSecuritySettings, wipeAllData, wipeUserData };

// Legacy function name for backwards compatibility
export const resetAllAppData = wipeAllData;

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  // OnboardingGate is now simplified since the main layout handles navigation
  return <>{children}</>;
}
