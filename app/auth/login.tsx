import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { auth } from '@/firebase';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const {  showNotification, } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleSignIn = async () => {
    if (!email || !password) {
      showNotification('Please enter both email and password', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      showNotification('Welcome back!', 'success');
      // Navigation will be handled by root layout
    } catch (error: any) {
      console.error('Sign in error:', error);
      showNotification(error.message || 'Failed to sign in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
  router.push('/auth/forgot-password');
  };
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ThemedView style={styles.inner}>
        <Text style={[styles.title, { color: textColor }]}>Welcome Back to{'\n'}FINSYNC</Text>        <ThemedTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />        <ThemedTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword} autoCapitalize='none'
          secureTextEntry
        />        <TouchableOpacity 
          onPress={handleForgotPassword}
          style={styles.forgotPassword}
        >
          <Text style={[styles.forgotPasswordText, { color: textColor }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
        <AppButton
          title={loading ? "Signing In..." : "Sign In"}
          onPress={handleSignIn}
          disabled={!email || !password || loading}
          style={styles.button}
          textStyle={styles.buttonText}
        />
        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: textColor }]}>Don't have an account? </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity>
              <Text style={[styles.signupLink, { color: textColor }]}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {/* <DataWipeDemo/> */}
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
    // maxWidth: 340,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  },  signupText: {
    fontSize: 16,
  },  signupLink: {
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
