import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { auth } from '@/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import apiClient from '@/services/apiClient';
import { Picker } from '@react-native-picker/picker';
import { State as CSCState } from 'country-state-city';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
// require() used because package lacks type declarations
// @ts-ignore
const NaijaStates: any = require('naija-state-local-government');

type RouteParams = {
  onCreated?: (customerId: string) => void;
};

export default function CreateNairaCardCustomer() {
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    bvn: '',
    date_of_birth: '1990-01-01',
    address: '',
    state: '',
  state_iso: '',
    lga: '',
    gender: 'male',
    occupation: '',
  });
  const [loading, setLoading] = useState(false);
  const [statesList, setStatesList] = useState<Array<{ name: string; isoCode: string }>>([]);
  const [lgasList, setLgasList] = useState<Array<{ name: string }>>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [lgasLoading, setLgasLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pickerBg = useThemeColor({ light: '#fff', dark: '#1C1C1C' }, 'background');
  const pickerBorder = useThemeColor({ light: '#ddd', dark: '#333' }, 'background');
  const pickerText = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const router = useRouter();

  // Autofill from firebase auth if available
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const sanitizePhone = (p?: string) => {
        if (!p) return '';
        // remove any non-digit characters, including leading '+'
        return p.replace(/\D/g, '');
      };

      setForm((s) => ({
        ...s,
        email: user.email ?? s.email,
        phone: sanitizePhone(user.phoneNumber ?? s.phone) as string,
        first_name: (user.displayName?.split(' ')[0]) ?? s.first_name,
        last_name: (user.displayName?.split(' ').slice(1).join(' ')) ?? s.last_name,
      }));
    }
  }, []);

  // Load Nigeria states using country-state-city
  useEffect(() => {
    setStatesLoading(true);
    try {
      const ng = CSCState.getStatesOfCountry('NG') || [];
      // map to minimal shape and sort alphabetically
      const items = ng.map((s: any) => ({ name: s.name, isoCode: s.isoCode }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setStatesList(items);
    } catch (e) {
      // ignore if package unavailable
      setStatesList([]);
    } finally {
      setStatesLoading(false);
    }
  }, []);

  // Load LGAs when state name changes using naija-state-local-government
  useEffect(() => {
    const stateName = form.state;
    if (!stateName) {
      setLgasList([]);
      setForm((s) => ({ ...s, lga: '' }));
      return;
    }
    setLgasLoading(true);
    (async () => {
      try {
        // Try several lookups because the package can return either an array or an object { lgas: [...] }
        let res: any = NaijaStates.lgas(stateName);

        // try without/add ' State' suffix
        if (!res) {
          const noState = stateName.replace(/\s*state$/i, '').trim();
          res = NaijaStates.lgas(noState) || NaijaStates.lgas(noState + ' State');
        }

        // fuzzy match against available state names
        if (!res && typeof NaijaStates.states === 'function') {
          const allStates = NaijaStates.states() as string[];
          const found = allStates.find((s: string) => s.toLowerCase() === stateName.toLowerCase() || s.toLowerCase().includes(stateName.toLowerCase()) || stateName.toLowerCase().includes(s.toLowerCase()));
          if (found) res = NaijaStates.lgas(found);
        }

        let lgasArr: string[] = [];
        if (Array.isArray(res)) {
          lgasArr = res as string[];
        } else if (res && Array.isArray(res.lgas)) {
          lgasArr = res.lgas;
        } else {
          lgasArr = [];
        }

        const items = lgasArr.map((name) => ({ name }));
        setLgasList(items);
      } catch (e) {
        setLgasList([]);
      } finally {
        setLgasLoading(false);
      }
    })();
  }, [form.state]);

  const validate = () => {
    if (!form.first_name || !form.last_name || !form.email || !form.phone) {
      Alert.alert('Missing fields', 'Please fill at least first name, last name, email and phone.');
      return false;
    }

    if (!form.state_iso) {
      Alert.alert('Missing state', 'Please select your state.');
      return false;
    }

    // If BVN provided, ensure it's digits-only and length 10 or 11
    if (form.bvn) {
      const bvnDigits = (form.bvn || '').replace(/\D/g, '');
      if (bvnDigits.length !== 10 && bvnDigits.length !== 11) {
        Alert.alert('Invalid BVN', 'BVN must be 10 or 11 digits.');
        return false;
      }
      // normalize in state to digits-only
      if (bvnDigits !== form.bvn) setForm((s) => ({ ...s, bvn: bvnDigits }));
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // normalize phone and bvn before submit
      const normalizedPhone = (form.phone || '').replace(/\D/g, '');
      const normalizedBvn = (form.bvn || '').replace(/\D/g, '');

      const body = {
        ...form,
        phone: normalizedPhone,
        bvn: normalizedBvn,
        // ensure lga is trimmed and state_iso included
        lga: (form.lga || '').trim(),
  state_iso: form.state_iso,
  // send state's isoCode (2-letter) as the `state` value expected by the backend
  state: form.state_iso,
        mode: 'sandbox',
      };

      const res = await apiClient.post('/naira-card/user/create', body);

      if (res && (res as any).success && (res as any).data && (res as any).data.data) {
  const created = (res as any).data.data;
  const customerId = created.customer_id || created.customerId || created.customer_id;
  // extract name from API response when present, fallback to concatenated first/last
  const createdName =`${(created.individual?.firstName || form.first_name).trim()} ${(created.individual?.lastName || form.last_name).trim()}`.trim();

        // Navigate to the create-card page and pass the created customer id and name so the user
        // can select card type/brand and finish card creation.
        try {
          const addressFromResponse = (created?.billingAddress?.line1 || form.address || '').trim();
          const addressParam = addressFromResponse ? `&address=${encodeURIComponent(addressFromResponse)}` : '';
          router.replace(`/cards/naira/create-naira-card?customer_id=${encodeURIComponent(customerId)}&name=${encodeURIComponent(createdName)}${addressParam}`);
        } catch (e) {
          // fallback to previous
          router.back();
        }
        return;
      }

      Alert.alert('Error', (res as any).error || (res as any).message || 'Failed to create customer');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // keyboardVerticalOffset gives room for native headers; adjust if your header is taller
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <ThemedText >Please enter accurately</ThemedText>

      {[
          { key: 'first_name', placeholder: 'First name' },
          { key: 'middle_name', placeholder: 'Middle name' },
          { key: 'last_name', placeholder: 'Last name' },
          { key: 'email', placeholder: 'Email', keyboardType: 'email-address', autoCapitalize: 'none' },
          { key: 'phone', placeholder: 'Phone (e.g. 2347000000000)', keyboardType: 'phone-pad', maxLength: 15 },
          { key: 'bvn', placeholder: 'BVN', keyboardType: 'numeric', maxLength: 11 },
          { key: 'date_of_birth', placeholder: 'Date of birth (YYYY-MM-DD)' },
          { key: 'address', placeholder: 'Address' },
          // 'state' field will be rendered as a Picker below
          { key: 'state', placeholder: 'State' },
          { key: 'lga', placeholder: 'LGA' },
          { key: 'gender', placeholder: 'Gender' },
          { key: 'occupation', placeholder: 'Occupation' },
        ].map((f) => {
          if (f.key === 'state') {
            return (
              <View key="state-picker" style={styles.pickerWrapper}>
                <ThemedText style={styles.pickerLabel}>State</ThemedText>
                <View style={[styles.pickerInner, { backgroundColor: pickerBg, borderColor: pickerBorder }]}> 
                  {statesLoading ? (
                    <View style={{ height: 44, justifyContent: 'center', alignItems: 'center' }}><FSActivityLoader /></View>
                  ) : (
                    <Picker
                      selectedValue={form.state_iso}
                      onValueChange={(val) => {
                        const found = statesList.find((s) => s.isoCode === val);
                        setForm((s) => ({ ...s, state: found ? found.name : '', state_iso: val }));
                      }}
                      style={[styles.picker, { color: pickerText }]}
                      dropdownIconColor={pickerText}
                    >
                      <Picker.Item label="Select state" value="" />
                      {statesList.map((s) => (
                        <Picker.Item key={s.isoCode} label={s.name} value={s.isoCode} />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>
            );
          }

          if (f.key === 'lga') {
            // render LGA picker when available, fallback to text input
            if (lgasList.length > 0) {
              return (
                <View key="lga-picker" style={styles.pickerWrapper}>
                  <ThemedText style={styles.pickerLabel}>LGA</ThemedText>
          <View style={[styles.pickerInner, { backgroundColor: pickerBg, borderColor: pickerBorder }]}> 
                    {lgasLoading ? (
                      <View style={{ height: 44, justifyContent: 'center', alignItems: 'center' }}><FSActivityLoader /></View>
                    ) : (
                      <Picker
                        selectedValue={form.lga}
                        onValueChange={(val) => setForm((s) => ({ ...s, lga: val }))}
                        style={[styles.picker, { color: pickerText }]}
                      >
                        <Picker.Item label="Select LGA" value="" />
                        {lgasList.map((l) => (
                          <Picker.Item key={l.name} label={l.name} value={l.name} />
                        ))}
                      </Picker>
                    )}
                  </View>
                </View>
              );
            }

            return (
              <ThemedTextInput
                key="lga-input"
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
              />
            );
          }

          return (
            <ThemedTextInput
              key={f.key}
              placeholder={f.placeholder}
              value={(form as any)[f.key]}
              onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
              keyboardType={(f as any).keyboardType}
              autoCapitalize={(f as any).autoCapitalize}
              maxLength={(f as any).maxLength}
            />
          );
        })}

            {loading ? <FSActivityLoader /> : <AppButton title="Create customer" onPress={submit} variant={isDark ? 'white' : 'dark'} />}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerWrapper: {
    marginVertical: 8,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  pickerInner: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 70,
    width: '100%',
  },
});
