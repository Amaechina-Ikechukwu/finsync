import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { auth } from '@/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';

export default function ForgotPasswordScreen() {
  const {  showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleResetPassword = async () => {
    if (!email) {
      showNotification('Please enter your email address', 'error');
      return;
    }

    if (!email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      showNotification('Password reset email sent! Check your inbox.', 'success');
      // Navigate back to login after success
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      showNotification(error.message || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.inner}>
        <ThemedText style={styles.title}>Reset Your{'\n'}Password</ThemedText>
        
        <ThemedText style={styles.description}>
          Enter your email address and we'll send you a link to reset your password.
        </ThemedText>

        <ThemedTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />

        <AppButton
          title={loading ? "Sending..." : "Send Reset Email"}
          onPress={handleResetPassword}
          disabled={!email || loading}
          style={styles.button}
          textStyle={styles.buttonText}
        />

        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backToLogin}
        >
          <ThemedText style={styles.backToLoginText}>
            Back to Sign In
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -50,
  },
  title: {
    fontSize: 36,
    fontWeight: '400',
    marginBottom: 16,
    textAlign: 'left',
    alignSelf: 'flex-start',
    fontFamily: 'Belgrano-Regular',
    lineHeight:40
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'left',
    alignSelf: 'flex-start',
    lineHeight: 22,
    opacity: 0.8,
  },
  button: {
    width: '100%',
    marginTop: 32,
    borderRadius: 20,
  },
  buttonText: {
    color: '#222',
    fontSize: 22,
    fontFamily: 'Belgrano-Regular',
  },
  backToLogin: {
    marginTop: 24,
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
