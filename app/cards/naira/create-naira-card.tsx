import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import apiClient from '@/services/apiClient';
import { nairaCardService } from '@/services/apiService';
import { useAppStore } from '@/store';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function CreateNairaCardPage() {
  const router = useRouter();
  const navigation: any = useNavigation();
  const params = useLocalSearchParams() as any;
  const customerId = params.customer_id as string | undefined;
  const nameFromParams = (params.name as string) || '';
  const addressFromParams = (params.address as string) || '';

  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual');
  const [brand, setBrand] = useState<'Verve' | 'AfriGo'>('AfriGo');
  // initialize name from query param; make non-editable below
  const [nameOnCard, setNameOnCard] = useState(nameFromParams);
  const [deliveryAddress, setDeliveryAddress] = useState(addressFromParams);
  const [loading, setLoading] = useState(false);
const {showNotification}=useNotification()
  const { userData } = useAppStore();
  // Physical application fields
  const [fullName, setFullName] = useState<string>(nameFromParams || userData?.fullname || '');
  const [phone, setPhone] = useState<string>(userData?.phone || '');
  const [stateName, setStateName] = useState<string>('');
  const [stateShortCode, setStateShortCode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [lga, setLga] = useState<string>('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputBg = useThemeColor({ light: '#fff', dark: '#1C1C1C' }, 'background');

  useEffect(() => {
    navigation.setOptions({
      title: 'Create Naira Card',
      headerShown: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const submit = async () => {
    // Physical: apply via dedicated endpoint; Virtual: create
    if (cardType === 'physical') {
      // Validate physical application fields
      if (!fullName.trim()) return showNotification('Please enter your full name.', 'info');
      if (!deliveryAddress.trim()) return showNotification('Please provide a delivery address.', 'info');
      if (!phone.trim()) return showNotification('Please provide your phone number.', 'info');
      if (!stateName.trim()) return showNotification('Please enter your state.', 'info');
      if (!stateShortCode.trim()) return showNotification('Please enter your state short code (e.g., Ab).', 'info');
      if (!city.trim()) return showNotification('Please enter your city.', 'info');
      if (!lga.trim()) return showNotification('Please enter your LGA.', 'info');

      setLoading(true);
      try {
        const payload = {
          full_name: fullName,
          address: deliveryAddress,
          state: stateName,
          phone,
          stateShortCode,
          city,
          lga,
        };
        showNotification('Submitting application…', 'info');
        const res = await nairaCardService.applyPhysical(payload);
        if (res.success) {
          showNotification(res.message || 'Application submitted', 'success');
          router.replace('/cards');
          return;
        }
        showNotification(res.message || 'Failed to submit application', 'error');
      } catch (err: any) {
        console.log({ err });
        showNotification('Network Error', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Virtual flow
    if (!customerId) {
      showNotification('Customer Id is missing.', 'info');
      return;
    }
    if (!nameOnCard) {
      showNotification('Name for the card is missing.', 'info');
      return;
    }
    if (!deliveryAddress.trim()) {
      showNotification('Please provide a delivery address.', 'info');
      return;
    }

    setLoading(true);
    try {
      const body = {
        type: cardType,
        name_on_card: nameOnCard,
        delivery_address: deliveryAddress,
        brand: brand,
        customer_id: customerId,
      };
      showNotification('Creating card', 'info');
      const res = await apiClient.post('/naira-card/create', body);

      if (res && (res as any).success && (res as any).data) {
        try {
          router.replace('/cards');
        } catch (e) {
          router.back();
        }
        return;
      }
      showNotification('Failed to create card', 'error');
    } catch (err: any) {
      console.log({ err });
      showNotification('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.centerContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <ThemedText style={styles.title}>Create Naira Card</ThemedText>

      <ThemedText style={styles.label}>Card type</ThemedText>
          <View style={[styles.optionRow, { backgroundColor: inputBg }]}> 
            <View style={{ flex: 1 }}>
              <AppButton
                title="Virtual card"
                onPress={() => setCardType('virtual')}
                variant={cardType === 'virtual' ? (isDark ? 'white' : 'dark') : 'outline'}
                style={cardType === 'virtual' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                textStyle={cardType === 'virtual' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppButton
                title="Physical"
                onPress={() => setCardType('physical')}
                variant={cardType === 'physical' ? (isDark ? 'white' : 'dark') : 'outline'}
                style={cardType === 'physical' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                textStyle={cardType === 'physical' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
              />
            </View>
          </View>
          {cardType === 'physical' && (
            <ThemedText style={styles.helper}>Physical card requests may require admin approval after submission.</ThemedText>
          )}

      <ThemedText style={styles.label}>Card brand</ThemedText>
          <View style={[styles.optionRow, { backgroundColor: inputBg }]}> 
            <View style={{ flex: 1 }}>
              <AppButton
                title="Afrigo"
                onPress={() => setBrand('AfriGo')}
                variant={brand === 'AfriGo' ? (isDark ? 'white' : 'dark') : 'outline'}
                style={brand === 'AfriGo' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                textStyle={brand === 'AfriGo' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppButton
                title="Verve"
                onPress={() => setBrand('Verve')}
                variant={brand === 'Verve' ? (isDark ? 'white' : 'dark') : 'outline'}
                style={brand === 'Verve' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                textStyle={brand === 'Verve' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
              />
            </View>
          </View>

          {/* Virtual name-on-card (readonly) */}
          {cardType === 'virtual' && (
            <>
              <ThemedText style={styles.label}>Name on card</ThemedText>
              <View style={styles.readonlyInput}>
                <ThemedText>{nameOnCard || '—'}</ThemedText>
              </View>
              <ThemedText style={styles.helper}>This value is taken from the created customer and is not editable.</ThemedText>
            </>
          )}

          {(cardType === 'physical' || !deliveryAddress?.trim()) && (
            <>
              <ThemedText style={styles.label}>Delivery address</ThemedText>
              <ThemedTextInput placeholder="Delivery address" value={deliveryAddress} onChangeText={setDeliveryAddress} />
            </>
          )}

          {/* Physical application fields */}
          {cardType === 'physical' && (
            <>
              <ThemedText style={styles.label}>Full name</ThemedText>
              <ThemedTextInput placeholder="Full name" value={fullName} onChangeText={setFullName} />

              <ThemedText style={styles.label}>Phone</ThemedText>
              <ThemedTextInput placeholder="Phone e.g. +2347012345678" value={phone} onChangeText={setPhone} />

              <ThemedText style={styles.label}>State</ThemedText>
              <ThemedTextInput placeholder="State" value={stateName} onChangeText={setStateName} />

              <ThemedText style={styles.label}>State short code</ThemedText>
              <ThemedTextInput placeholder="e.g. Ab" value={stateShortCode} onChangeText={setStateShortCode} />

              <ThemedText style={styles.label}>City</ThemedText>
              <ThemedTextInput placeholder="City" value={city} onChangeText={setCity} />

              <ThemedText style={styles.label}>LGA</ThemedText>
              <ThemedTextInput placeholder="LGA" value={lga} onChangeText={setLga} />
            </>
          )}

          <View style={{ height: 16 }} />
          {loading ? (
            <AppButton title="Creating…" variant="outline" disabled onPress={()=>{}} />
          ) : (
            <AppButton title={cardType === 'physical' ? 'Submit application' : 'Create card'} onPress={submit} variant={isDark ? 'white' : 'dark'} />
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  form: { alignSelf: 'center', width: '100%', maxWidth: 520 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  optionRow: { flexDirection: 'row', padding: 8, borderRadius: 12 },
  readonlyInput: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 14 },
  helper: { color: '#666', marginTop: 6, fontSize: 12, textAlign: 'center' },
});
