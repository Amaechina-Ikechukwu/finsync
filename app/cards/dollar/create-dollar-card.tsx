import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import apiClient from '@/services/apiClient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function CreateDollarCardPage() {
  const router = useRouter();
  const navigation: any = useNavigation();
  const params = useLocalSearchParams() as any;
  const customerId = params.customer_id as string | undefined;
  const nameFromParams = (params.name as string) || '';
  const addressFromParams = (params.address as string) || '';

  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual');
  const [brand, setBrand] = useState<'Visa' | 'Mastercard'>('Visa');
  const [nameOnCard, setNameOnCard] = useState(nameFromParams);
  const [deliveryAddress, setDeliveryAddress] = useState(addressFromParams);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputBg = useThemeColor({ light: '#fff', dark: '#1C1C1C' }, 'background');

  useEffect(() => {
    navigation.setOptions({
      title: 'Create Dollar Card',
      headerShown: true,
    });
  }, [navigation]);

  const submit = async () => {
    if (!customerId) {
      showNotification('Customer Id is missing.', 'info');
      return;
    }
    if (!nameOnCard) {
      showNotification('Name for the card is missing.', 'info');
      return;
    }
    if (cardType === 'physical') {
      showNotification('Physical card creation will be available soon.', 'info');
      return;
    }
    if (!deliveryAddress.trim()) {
      showNotification('Please provide a delivery address.', 'info');
      return;
    }

    setLoading(true);
    try {
      const body = {
        card_type: cardType,
        name_on_card: nameOnCard,
        delivery_address: deliveryAddress,
        brand: brand,
        customer_id: customerId,
      };
      showNotification('Creating card', 'info');
      const res = await apiClient.post('/dollar-card/create', body);

      if (res && (res as any).success && (res as any).data) {
        const inner = (res as any).data;
        const cardId = inner.data && inner.data.card_id ? inner.data.card_id : undefined;
        try {
          router.replace('/cards');
        } catch (e) {
          router.back();
        }
        return;
      }
      showNotification('Failed to create card', 'error');
    } catch (err: any) {
      showNotification('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.centerContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <ThemedText style={styles.title}>Create Dollar Card</ThemedText>

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
            <ThemedText style={styles.helper}>Physical card creation is coming soon.</ThemedText>
          )}

          <ThemedText style={styles.label}>Card brand</ThemedText>
          <View style={[styles.optionRow, { backgroundColor: inputBg }]}> 
            <View style={{ flex: 1 }}>
              <AppButton
                title="Visa"
                onPress={() => setBrand('Visa')}
                variant={brand === 'Visa' ? (isDark ? 'white' : 'dark') : 'outline'}
                style={brand === 'Visa' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                textStyle={brand === 'Visa' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppButton
                title="Mastercard"
                onPress={() => setBrand('Mastercard')}
                variant={brand === 'Mastercard' ? (isDark ? 'white' : 'dark') : 'outline'}
                style={brand === 'Mastercard' ? undefined : { backgroundColor: isDark ? '#1f1f1f' : '#f2f2f7', borderWidth: 1, borderColor: isDark ? '#3a3a3c' : '#d1d1d6' }}
                textStyle={brand === 'Mastercard' ? undefined : { color: isDark ? '#d1d1d6' : '#3a3a3c' }}
              />
            </View>
          </View>

          <ThemedText style={styles.label}>Name on card</ThemedText>
          <View style={styles.readonlyInput}>
            <ThemedText>{nameOnCard || '—'}</ThemedText>
          </View>
          <ThemedText style={styles.helper}>This value is taken from the created customer and is not editable.</ThemedText>

          {(cardType === 'physical' || !deliveryAddress?.trim()) && (
            <>
              <ThemedText style={styles.label}>Delivery address</ThemedText>
              <ThemedTextInput placeholder="Delivery address" value={deliveryAddress} onChangeText={setDeliveryAddress} />
            </>
          )}

          <View style={{ height: 16 }} />
          {loading ? (
            <AppButton title="Creating…" variant="outline" disabled onPress={() => {}} />
          ) : (
            <AppButton title="Create card" onPress={submit} variant={isDark ? 'white' : 'dark'} />
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
