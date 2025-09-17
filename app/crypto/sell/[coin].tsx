import CryptoEstimateModal from '@/components/CryptoEstimateModal';
import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import apiClient from '@/services/apiClient';
import { useAppStore } from '@/store';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SellCoinScreen() {
  const { coin } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [nairaAmount, setNairaAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [estimate, setEstimate] = useState<any | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const themeText = useThemeColor({}, 'text');
  const { showNotification } = useNotification();

  const storeCoins = useAppStore(state => state.coins || []);
  const [selectedCoinId, setSelectedCoinId] = useState<string | undefined>(String(coin ?? ''));
  const [coinModalVisible, setCoinModalVisible] = useState(false);

  // Resolve selected coin object for display
  const selectedCoin = storeCoins.find((c: any) => String(c.id) === String(selectedCoinId)) ?? null;
  useEffect(() => {
    // Native header with Buy button on the right
    navigation.setOptions({
      title: 'Sell Crypto',
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/crypto/buy/[coin]', params: { coin: selectedCoinId ?? coin } })}
          style={{ paddingHorizontal: 12 }}
          accessibilityLabel="Buy"
        >
          <ThemedText style={{ color: themeText, fontWeight: '600' }}>Go to buy</ThemedText>
        </TouchableOpacity>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, coin, themeText]);

  // Note: single-button flow — users enter amount and their sending wallet, then tap
  // the button to fetch an estimate which includes the address to send to.

  // Format input to include thousand separators (e.g. 1234567 -> 1,234,567)
  const formatNaira = (input: string) => {
    if (!input) return '';
    // Remove any non-digit characters
    const digits = input.replace(/[^0-9]/g, '');
    if (!digits) return '';
    // Prevent leading zeros being shown as multiple zeros
    const asNumber = parseInt(digits, 10);
    if (Number.isNaN(asNumber)) return '';
    return asNumber.toLocaleString();
  };

  const getEstimate = async () => {
    if (!cryptoAmount || Number.isNaN(Number(cryptoAmount))) {
      Alert.alert('Invalid amount', 'Please enter a valid crypto amount');
      return;
    }

    setIsEstimating(true);
    try {
  const body = { coinId: String(selectedCoinId ?? coin), cryptoAmount: String(cryptoAmount) };
      const resp = await apiClient.post<any>('/crypto/sell/estimate', body);
      if (!resp || !resp.success) {
        const err = (resp && (resp.message || resp.error)) || 'Failed to get estimate';
        Alert.alert('Estimate failed', String(err));
        setEstimate(null);
      } else {
  setEstimate(resp);
  // auto-open modal for the estimate
  setEstimateVisible(true);
        // set nairaAmount to net_amount from estimate for display in the input-like field
        if (resp.net_amount !== undefined && resp.net_amount !== null) {
          setNairaAmount(String(Number(resp.net_amount)));
        }
      }
    } catch (err: any) {
      console.error('Estimate error', err);
      Alert.alert('Estimate error', err?.message || String(err));
    } finally {
      setIsEstimating(false);
    }
  };

  const copyWalletAddress = async () => {
    const addr = estimate?.our_wallet_address;
    if (!addr) return;
    await Clipboard.setStringAsync(addr);
    // Use in-app notification toast when available
    try {
      showNotification('Wallet address copied to clipboard', 'success');
    } catch (e) {
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  };

  const [estimateVisible, setEstimateVisible] = useState(false);


  return (
    <SafeAreaView style={styles.safe}>
      <ThemedView style={styles.container}>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => setCoinModalVisible(true)} style={{ alignItems: 'center' }} accessibilityRole="button">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ThemedText type="title" style={styles.coinLabel}>
                {selectedCoin ? `${selectedCoin.symbol} • ${selectedCoin.network}` : String(selectedCoinId ?? coin ?? '').toUpperCase()}
              </ThemedText>
              <MaterialIcons name="keyboard-arrow-down" size={28} color={themeText} style={{ marginLeft: 8 }} />
            </View>
            <ThemedText style={{ fontSize: 12, color: themeText, marginTop: -6 }}>Tap to change coin</ThemedText>
          </TouchableOpacity>

          {/* Coin selection modal */}
          <Modal visible={coinModalVisible} animationType="slide" transparent onRequestClose={() => setCoinModalVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, maxHeight: '80%' }}>
                <FlatList
                  data={storeCoins}
                  keyExtractor={(i) => String((i as any).id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }} onPress={() => { setSelectedCoinId(String(item.id)); setCoinModalVisible(false); }}>
                      <ThemedText style={{ fontWeight: '600' }}>{item.name} ({item.symbol})</ThemedText>
                      <ThemedText style={{ color: '#666', marginTop: 4 }}>{item.network} • ₦{Number(item.current_price_naira).toLocaleString()}</ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

            <ThemedText style={[styles.infoText, { marginTop: 12,textAlign:"left",marginBottom:10 }]}>How it works: Enter the amount you want to sell and paste the wallet you'll send from. Tap "Get estimate" to retrieve the address to send to and the amount you'll receive. Once the transaction is confirmed, we'll credit your account.</ThemedText>
          <View style={styles.form}>
            <ThemedText style={styles.label}>Amount ({String(coin ?? '').toUpperCase()})</ThemedText>
            <ThemedTextInput
              value={cryptoAmount}
              onChangeText={(t) => setCryptoAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder="Enter amount in crypto (e.g. 7)"
              keyboardType="numeric"
              style={[styles.input, { color: themeText }]}
              returnKeyType="done"
            />

            <AppButton title={isEstimating ? 'Estimating...' : 'Get estimate'} onPress={getEstimate} style={{ marginTop: 12 }} disabled={isEstimating} />


            {/* estimate modal auto-shown after successful response */}
            <CryptoEstimateModal
              estimate={estimate}
              visible={estimateVisible}
              onClose={() => setEstimateVisible(false)}
              onCopy={(address) => {
                if (!address) return;
                Clipboard.setStringAsync(address);
                try {
                  showNotification('Wallet address copied to clipboard', 'success');
                } catch (e) {
                  Alert.alert('Copied', 'Wallet address copied to clipboard');
                }
              }}
            />

            {/* <ThemedText style={[styles.label, { marginTop: 12 }]}>Your wallet (sending from)</ThemedText>
            <TextInput
              value={walletAddress}
              onChangeText={setWalletAddress}
              placeholder="Paste the wallet you'll send from"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: themeText }]}
            /> */}

            <ThemedText style={styles.infoText}>Processing usually takes 15–30 minutes; the amount will be credited to your account once processing completes and the transaction is confirmed.</ThemedText>

            {/* Single-button flow: users enter amount + their sending wallet, then fetch estimate/address */}
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  // Center everything vertically and horizontally
  container: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
  inner: { width: '100%', maxWidth: 520, alignItems: 'center' },
  coinLabel: { fontSize: 36, letterSpacing: 2, textAlign: 'center', marginBottom: 18 },
  form: { width: '100%' },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  infoText: {
    marginTop: 12,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
