import Onboarding from '@/components/Onboarding';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleFinish = async () => {
    console.log('OnboardingScreen: Starting handleFinish');
    try {
      // Mark onboarding as completed
      await SecureStore.setItemAsync('seenOnboarding', 'true');
      console.log('OnboardingScreen: Successfully set seenOnboarding to true');
      
      // Add a small delay to ensure the state is saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify it was set
      const verification = await SecureStore.getItemAsync('seenOnboarding');
      console.log('OnboardingScreen: Verification check:', verification);
      
      // Navigate to login
      console.log('OnboardingScreen: Navigating to login');
  router.replace('/auth/login');
    } catch (error) {
      console.error('OnboardingScreen: Error in handleFinish:', error);
    }
  };

  return (
    <Onboarding onFinish={handleFinish} />
  );
}
