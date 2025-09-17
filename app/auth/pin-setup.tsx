import AppLock from '@/components/security/AppLock';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import React from 'react';

export default function PinSetupScreen() {
  const router = useRouter();

  const handlePinSetupComplete = async () => {
    console.log('PinSetupScreen: PIN setup completed, navigating to biometrics setup');
    router.replace('/auth/biometrics-setup');
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppLock 
        onUnlock={handlePinSetupComplete}
        isSettingPin={true}
      />
    </ThemedView>
  );
}
