import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { userService } from '@/services/apiService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ChangePinOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ otpId: string }>();
  const { showNotification } = useNotification();
  const [currentOtpId, setCurrentOtpId] = useState<string>(params.otpId || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setCanResend(true);
  }, [countdown]);

  const handleVerify = async () => {
    if (!currentOtpId) {
      showNotification('Missing OTP session. Please restart.', 'error');
      router.replace('/settings/change-pin');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      showNotification('Enter the 6-digit code', 'error');
      return;
    }

    setLoading(true);
    try {
  const res = await userService.confirmTransactionPinReset({ otpId: String(currentOtpId), otpCode: otp });
      if (res.success && res.data?.verified) {
        showNotification('OTP verified', 'success');
        router.push('/settings/change-pin/new-pin');
      } else {
        showNotification(res.message || 'OTP verification failed', 'error');
      }
    } catch (e: any) {
      showNotification(e?.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    try {
      const res = await userService.requestTransactionPinReset();
      if (res.success && res.data?.otpId) {
        setCurrentOtpId(res.data.otpId);
        showNotification('New OTP sent', 'success');
      } else {
        showNotification(res.message || 'Failed to resend OTP', 'error');
      }
    } catch (e: any) {
      showNotification(e?.message || 'Network error', 'error');
    }
  };

  const onChange = (text: string) => {
    const v = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(v);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Enter OTP</ThemedText>
        <ThemedText style={styles.subtitle}>We sent a 6‑digit code to your phone.</ThemedText>
        <ThemedTextInput
          placeholder="6-digit code"
          value={otp}
          onChangeText={onChange}
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
          autoFocus
        />
        <View style={styles.row}>
          <ThemedText style={styles.hint}>Didn't get it?</ThemedText>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <ThemedText style={styles.link}>Resend</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.hint}>Resend in {countdown}s</ThemedText>
          )}
        </View>
        <AppButton title={loading ? 'Verifying…' : 'Verify'} onPress={handleVerify} loading={loading} disabled={otp.length !== 6 || loading} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 420 },
  title: { textAlign: 'center', marginBottom: 8, fontFamily: 'Belgrano-Regular' },
  subtitle: { textAlign: 'center', marginBottom: 16, opacity: 0.9, fontFamily: 'Belgrano-Regular' },
  input: { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  row: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  hint: { opacity: 0.8, marginBottom: 6 },
  link: { color: '#3B82F6', fontWeight: '600' },
});
