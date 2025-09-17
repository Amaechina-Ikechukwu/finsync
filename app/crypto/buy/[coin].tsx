import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import apiClient from '@/services/apiClient';
import { useAppStore } from '@/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuyCoinScreen() {
  const { coin } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [nairaAmount, setNairaAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const themeText = useThemeColor({}, 'text');
  const { showNotification } = useNotification();

  const storeCoins = useAppStore(state => state.coins || []);
  const [selectedCoinId, setSelectedCoinId] = useState<string | undefined>(String(coin ?? ''));
  const [coinModalVisible, setCoinModalVisible] = useState(false);

  // Resolve selected coin object for display
  const selectedCoin = storeCoins.find((c: any) => String(c.id) === String(selectedCoinId)) ?? null;

  useEffect(() => {
    navigation.setOptions({
      title: 'Buy Crypto',
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/crypto/sell/[coin]', params: { coin: selectedCoinId ?? coin } })}
          style={{ paddingHorizontal: 12 }}
          accessibilityLabel="Sell"
        >
          <ThemedText style={{ color: themeText, fontWeight: '600' }}>Go to sell</ThemedText>
        </TouchableOpacity>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, coin, themeText, selectedCoinId]);

  const handleBuy = () => {
    if (!nairaAmount || Number.isNaN(Number(nairaAmount.replace(/,/g, '')))) {
      showNotification('Please enter a valid naira amount', 'error');
      return;
    }
    if (!walletAddress || walletAddress.trim().length < 8) {
      showNotification('Please provide a valid wallet address', 'error');
      return;
    }

    // Build payload expected by the API
    const payload = {
      coinId: String(selectedCoinId ?? coin ?? '').toUpperCase(),
      amountInNaira: Number(nairaAmount.replace(/,/g, '')),
      userWalletAddress: walletAddress.trim(),
    };

    setLoading(true);
    apiClient
      .post('/crypto/buy/enhanced', payload)
      .then((res: any) => {
        setLoading(false);
        if (res && res.success) {
          router.push({
            pathname: '/crypto/buy/success',
            params: {
              txId: res.transaction_id,
              coin: res.coin?.symbol ?? payload.coinId,
              amount_naira: String(res.amount_naira ?? payload.amountInNaira),
              crypto_amount: String(res.crypto_amount ?? ''),
              estimated_delivery: res.estimated_delivery ?? '',
              message: res.message ?? '',
              user_wallet_address: res.user_wallet_address ?? payload.userWalletAddress,
            },
          });
        } else {
          const msg = (res && (res.message || res.error)) || 'Unable to create buy order';
          showNotification(String(msg), 'error');
        }
      })
      .catch((err: any) => {
        setLoading(false);
        showNotification(err?.message || 'An error occurred while processing your request', 'error');
      });
  };

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

          <View style={styles.form}>
            <ThemedText style={styles.label}>Amount (₦)</ThemedText>
            <ThemedTextInput
              value={nairaAmount}
              onChangeText={(t) => setNairaAmount(formatNaira(t))}
              placeholder="Enter amount in Naira"
              keyboardType="numeric"
              style={[styles.input, { color: themeText }]}
              returnKeyType="done"
            />

            <ThemedText style={[styles.label, { marginTop: 12 }]}>Wallet Address</ThemedText>
            <ThemedTextInput
              value={walletAddress}
              onChangeText={setWalletAddress}
              placeholder="Paste wallet address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: themeText }]}
            />

            <ThemedText style={styles.infoText}>Processing usually takes 15–30 minutes; the amount will be deducted from your balance once processing completes.</ThemedText>
            <ThemedText style={styles.feeText}>Transaction fee varies between ₦500–₦3,000 and will be applied at checkout.</ThemedText>

            <AppButton title="Proceed to buy" onPress={handleBuy} style={{ marginTop: 20 }} />
            {loading ? (
              <View style={{ marginTop: 12 }}>
                <ActivityIndicator size="small" color={themeText} />
              </View>
            ) : null}
          </View>

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
  feeText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
