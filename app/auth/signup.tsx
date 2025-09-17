import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { auth } from '@/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const { showNotification} = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const validatePassword = (pass: string, confirmPass: string) => {
    if (pass.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return false;
    }
    if (pass !== confirmPass) {
      showNotification('Passwords do not match', 'error');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (!validatePassword(password, confirmPassword)) return;
    
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      setEmailSent(true);
      showNotification('Account created! Please check your email to verify your account.', 'success');
      
      // Navigation will be handled by root layout after email verification
    } catch (error: any) {
      console.error('Sign up error:', error);
      showNotification(error.message || 'Failed to create account', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        showNotification('Email verified successfully!', 'success');
        // Navigation will be handled by root layout
      } else {
        showNotification('Email not verified yet. Please check your email.', 'error');
      }
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        showNotification('Verification email sent again!', 'success');
      } catch (error) {
        showNotification('Failed to resend email', 'error');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
  
      <ThemedView style={styles.inner}>
        <Text style={[styles.title, { color: textColor }]}>
          {emailSent ? 'Verify your email' : 'Enter detail to join\nFINSYNC'}
        </Text>
        
        {emailSent ? (
          <View style={styles.verificationContainer}>
            <Text style={[styles.verificationText, { color: textColor }]}>
              We've sent a verification email to {email}. Please check your email and click the verification link.
            </Text>
            
            <AppButton
              title="I've verified my email"
              onPress={checkEmailVerification}
              style={styles.button}
              textStyle={styles.buttonText}
            />
            
            <TouchableOpacity onPress={resendVerificationEmail} style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: textColor }]}>
                Didn't receive the email? Resend
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ThemedTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <ThemedTextInput
              placeholder="Enter strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry autoCapitalize='none'
            />
            <ThemedTextInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry autoCapitalize='none'
            />
            <AppButton
              title={loading ? "Creating Account..." : "Continue"}
              onPress={handleSignUp}
              disabled={!email || !password || !confirmPassword || loading}
              style={styles.button}
              textStyle={styles.buttonText}
            />
          </>
        )}
        
        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: textColor }]}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.signupLink, { color: textColor }]}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
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
    marginTop: 120,
    padding:20
  },
  title: {
    fontSize: 36,
    fontWeight: '400',
    marginBottom: 32,
    textAlign: 'left',
    alignSelf: 'flex-start',
    fontFamily: 'Belgrano-Regular',
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
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 16,
  },  signupLink: {
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  verificationContainer: {
    width: '100%',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  resendContainer: {
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
