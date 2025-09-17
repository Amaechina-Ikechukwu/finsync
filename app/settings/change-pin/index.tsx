import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { userService } from '@/services/apiService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function ConfirmChangePinScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    Alert.alert(
      'Change Transaction PIN',
      'We will send a 6-digit OTP to your registered phone number to confirm this action.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send OTP',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await userService.requestTransactionPinReset();
              if (res.success && res.data?.otpId) {
                showNotification('OTP sent. Please check your phone.', 'success');
                router.push({ pathname: '/settings/change-pin/otp', params: { otpId: res.data.otpId } });
              } else {
                showNotification(res.message || 'Failed to send OTP', 'error');
              }
            } catch (e: any) {
              showNotification(e?.message || 'Network error', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Change Transaction PIN</ThemedText>
        <ThemedText style={styles.subtitle}>
          For your security, we need to verify it’s you. We’ll send a 6‑digit code to your phone.
        </ThemedText>
        <AppButton title={loading ? 'Sending…' : 'Continue'} onPress={handleStart} loading={loading} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 420 },
  title: { textAlign: 'center', marginBottom: 8, fontFamily: 'Belgrano-Regular' },
  subtitle: { textAlign: 'center', marginBottom: 24, opacity: 0.9, fontFamily: 'Belgrano-Regular' },
});
