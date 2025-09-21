import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { auth } from '@/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { sendEmailVerification } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function VerifyEmailScreen() {
  const { showNotification } = useNotification();
  const textColor = useThemeColor({}, 'text');
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setEmail(auth.currentUser?.email ?? null);
    // Light polling so users don't have to tap repeatedly
    pollRef.current = setInterval(() => {
      void checkNow(true);
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const checkNow = async (silent = false) => {
    if (!auth.currentUser) return;
    try {
      setChecking(true);
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        if (!silent) showNotification('Email verified!', 'success');
        // Proceed to BVN flow next
        router.replace('/auth/bvn-entry');
      } else if (!silent) {
        showNotification('Not verified yet. Please tap the link in your email.', 'info');
      }
    } catch (e) {
      if (!silent) showNotification('Failed to check verification status', 'error');
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    if (!auth.currentUser) return;
    try {
      setResending(true);
      await sendEmailVerification(auth.currentUser);
      showNotification('Verification email resent', 'success');
    } catch (e) {
      showNotification('Failed to resend email', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Verify your email</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textColor }]}>
          We sent a verification link to
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.email}>{email ?? 'your email'}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textColor }]}>
          Please open the link, then come back here.
        </ThemedText>

        <View style={styles.actions}>
          <AppButton title={checking ? 'Checking…' : "I've verified"} onPress={() => checkNow()} disabled={checking} style={styles.button} />
          <AppButton title={resending ? 'Resending…' : 'Resend email'} onPress={resend} disabled={resending} variant="white" style={styles.button} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  content: { alignItems: 'center', gap: 12 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', opacity: 0.75 },
  email: { textAlign: 'center', marginBottom: 8 },
  actions: { width: '100%', gap: 12, marginTop: 20 },
  button: { borderRadius: 20 },
});
