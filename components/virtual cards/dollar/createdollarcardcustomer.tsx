import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { auth } from '@/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import apiClient from '@/services/apiClient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

export default function CreateDollarCardCustomer() {
  // Expected payload for /strowallet/customer
  // {
  //  houseNumber, firstName, lastName, idNumber, customerEmail, phoneNumber,
  //  dateOfBirth, idImage, userPhoto, line1, state, zipCode, city, country, idType
  // }
  const [form, setForm] = useState({
    houseNumber: '123',
    firstName: '',
    lastName: '',
    idNumber: '',
    customerEmail: '',
    phoneNumber: '',
    dateOfBirth: '1990-01-01',
    idImage: 'http://placeimg.com/640/480',
    userPhoto: '',
    line1: '',
    state: '',
    zipCode: '',
    city: '',
    country: 'US',
    idType: 'PASSPORT' as 'BVN' | 'PASSPORT',
  });
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputBg = useThemeColor({ light: '#fff', dark: '#1C1C1C' }, 'background');

  const router = useRouter();

  // Autofill from firebase auth if available
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const sanitizePhone = (p?: string) => {
        if (!p) return '';
        // keep + and digits
        const onlyDigits = p.replace(/[^+\d]/g, '');
        return onlyDigits;
      };
      const first = user.displayName?.split(' ')[0] || '';
      const last = (user.displayName?.split(' ').slice(1).join(' ')) || '';
      setForm((s) => ({
        ...s,
        customerEmail: user.email ?? s.customerEmail,
        phoneNumber: sanitizePhone(user.phoneNumber ?? s.phoneNumber) as string,
        firstName: first || s.firstName,
        lastName: last || s.lastName,
      }));
    }
  }, []);

  // basic uuid fallback generator if platform lacks crypto.randomUUID
  const genId = useMemo(() => {
    const rng = () => Math.random().toString(16).slice(2);
    const fallback = () => `${rng()}-${rng().slice(0,4)}-${rng().slice(0,4)}-${rng().slice(0,4)}-${rng()}`;
    try {
      // @ts-ignore
      if (typeof globalThis.crypto?.randomUUID === 'function') {
        // @ts-ignore
        return () => globalThis.crypto.randomUUID();
      }
    } catch {}
    return fallback;
  }, []);

  const validate = () => {
  const required: Array<keyof typeof form> = [
      'firstName', 'lastName', 'customerEmail', 'phoneNumber', 'dateOfBirth',
      'line1', 'city', 'state', 'zipCode', 'country', 'idType', 'houseNumber',
    ];
    const missing = required.filter((k) => !(String(form[k] || '').trim().length));
    if (missing.length) {
      Alert.alert('Missing fields', `Please fill: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // ensure idNumber present
      const idNumber = form.idNumber?.trim() || genId();

      const customerPayload = {
        ...form,
        idNumber,
        // API example shows lowercase e.g. "passport"
        idType: (form.idType || 'PASSPORT').toLowerCase(),
      };

  // This endpoint can be slow; allow a longer timeout
  const res = await apiClient.post('/strowallet/customer', customerPayload, { timeout: 120000 });

      // Handle both shapes: { success, data: { response } } or { success, response }
      const top: any = res || {};
      const inner = top?.data ?? top;
      const response = inner?.response ?? inner?.data?.response ?? null;

      if (top?.success && (response || inner?.response || inner)) {
        const result = response || inner?.response || inner;
        const customerEmail = result.customerEmail || form.customerEmail;

        // Immediately create the dollar card with email
        const createBody = { customerEmail, mode: 'sandbox' } as const;
  const createRes = await apiClient.post('/dollar-card/create', createBody, { timeout: 90000 });

        const createTop: any = createRes || {};
        if (createTop?.success) {
          // Navigate to cards and auto-scroll to dollar card view
          try {
            router.replace({ pathname: '/cards', params: { target: 'dollar' } });
          } catch (e) {
            router.back();
          }
          return;
        }
        Alert.alert('Card creation failed', createTop?.message || createTop?.error || 'Please try again.');
        return;
      }

      if (top?.error === 'Aborted') {
        Alert.alert('Timeout', 'The request took too long and was canceled. Please check your connection and try again.');
      } else {
        Alert.alert('Error', top?.message || top?.error || 'Failed to create customer');
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('aborted')) {
        Alert.alert('Timeout', 'The request took too long and was canceled. Please try again.');
      } else {
        Alert.alert('Error', err?.message || 'Network error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <ThemedText>Please enter accurately</ThemedText>
            {[
              { key: 'firstName', placeholder: 'First name' },
              { key: 'lastName', placeholder: 'Last name' },
              { key: 'customerEmail', placeholder: 'Email', keyboardType: 'email-address', autoCapitalize: 'none' },
              { key: 'phoneNumber', placeholder: 'Phone (e.g. +15551234567)', keyboardType: 'phone-pad', maxLength: 18 },
              { key: 'dateOfBirth', placeholder: 'Date of birth (YYYY-MM-DD)' },
              { key: 'idNumber', placeholder: 'ID Number' },
              { key: 'houseNumber', placeholder: 'House number' },
              { key: 'line1', placeholder: 'Street address (line1)' },
              { key: 'city', placeholder: 'City' },
              { key: 'state', placeholder: 'State/Region' },
              { key: 'zipCode', placeholder: 'Zip/Postal code' },
              { key: 'country', placeholder: 'Country code (e.g. US)' },
              { key: 'idImage', placeholder: 'ID Image URL' },
              { key: 'userPhoto', placeholder: 'User Photo URL' },
            ].map((f) => (
              <ThemedTextInput
                key={f.key}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                keyboardType={(f as any).keyboardType}
                autoCapitalize={(f as any).autoCapitalize}
                maxLength={(f as any).maxLength}
              />
            ))}

            {/* ID Type selector (side by side) */}
            <ThemedText style={styles.label}>ID Type</ThemedText>
            <View style={[styles.optionRow, { backgroundColor: inputBg }]}> 
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Passport"
                  onPress={() => setForm((s) => ({ ...s, idType: 'PASSPORT' }))}
                  variant={form.idType === 'PASSPORT' ? (isDark ? 'white' : 'dark') : 'outline'}
                  style={form.idType === 'PASSPORT' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                  textStyle={form.idType === 'PASSPORT' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <AppButton
                  title="BVN"
                  onPress={() => setForm((s) => ({ ...s, idType: 'BVN' }))}
                  variant={form.idType === 'BVN' ? (isDark ? 'white' : 'dark') : 'outline'}
                  style={form.idType === 'BVN' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                  textStyle={form.idType === 'BVN' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
                />
              </View>
            </View>

            {loading ? <FSActivityLoader /> : (
              <AppButton title="Create customer & card" onPress={submit} variant={isDark ? 'white' : 'dark'} />
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  optionRow: { flexDirection: 'row', padding: 8, borderRadius: 12 },
});
