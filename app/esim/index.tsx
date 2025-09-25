import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { EsimPurchase, esimService } from '@/services/apiService';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

// eSIM list screen
export default function EsimIndexScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const navigation = useNavigation();

  const [items, setItems] = useState<EsimPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle to use local mock data until the backend API is available.
  // Set to `false` when your `/esim/purchases` endpoint is ready.
  const USE_MOCK_ESIMS = true;

  const sampleEsims: EsimPurchase[] = [
    { id: 'demo-1', product: 'Airalo - 1GB (7 days)', status: 'active', phone: '+1 555 0100', country: 'US', purchasedAt: Date.now() },
    { id: 'demo-2', product: 'Airalo - 3GB (30 days)', status: 'received', phone: '+44 7700 900', country: 'GB', purchasedAt: Date.now() - 1000 * 60 * 60 * 24 },
  ];

  // Fetch purchased virtual numbers and filter for eSIMs.
  // Assumption: the purchases endpoint returns items whose `type` or `product` indicate eSIM purchases.
  const fetchEsims = async () => {
    try {
      setLoading(true);
      setError(null);

     

      const response = await esimService.getPurchasedEsims();
      if (response && (response as any).success === true && Array.isArray((response as any).data)) {
        setItems((response as any).data as EsimPurchase[]);
      } else if (Array.isArray(response)) {
        setItems(response as EsimPurchase[]);
      } else {
        setError('Failed to fetch eSIM purchases');
      }
    } catch (err) {
      console.error('Error fetching eSIMs', err);
      setError('Error fetching eSIM purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEsims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set native header and conditional headerRight when items exist
  useEffect(() => {
    navigation.setOptions?.({
      title: 'ESIMs',
      headerShown: true,
      headerRight: items.length > 0 ? () => (
        <TouchableOpacity
          onPress={handleBuy}
          style={{ paddingHorizontal: 12 }}
          accessibilityLabel="Buy eSIM"
        >
          <ThemedText style={{ fontWeight: '600' }}>Buy</ThemedText>
        </TouchableOpacity>
      ) : undefined,
    });
  }, [navigation, items.length, router]);

  const handleBuy = () => router.push('/esim/countries');

  const handleItemPress = (v: EsimPurchase) => {
    // Navigate to eSIM detail page - adjust path if your app uses a different route
  router.push({ pathname: '/esim', params: { orderId: v.id } });
  };

  const renderItem = ({ item }: { item: EsimPurchase }) => (
    <TouchableOpacity onPress={() => handleItemPress(item)} style={styles.cardContainer} activeOpacity={0.8}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1F1F1F' : '#fff' }]}>
        <View style={styles.cardHeader}>
          <View>
            <ThemedText style={styles.phone}>{item.phone}</ThemedText>
            <ThemedText style={styles.sub}>{item.country?.toUpperCase()}</ThemedText>
          </View>
          <View style={[styles.status, { backgroundColor: getStatusColor(item.status, isDark) }]}>
            <ThemedText style={styles.statusText}>{item.status}</ThemedText>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <ThemedText style={styles.detailLabel}>Product: </ThemedText>
          <ThemedText style={styles.detailValue}>{item.product}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {/* Header area inside page for subtitle and buy button when items exist */}
        

        {loading ? (
          <ThemedView style={styles.loading}><FSActivityLoader/></ThemedView>
        ) : error ? (
          <ThemedView style={styles.center}><ThemedText>{error}</ThemedText><AppButton title="Retry" onPress={fetchEsims} style={{ marginTop: 12 }} /></ThemedView>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={[styles.list, { flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
            
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <IconSymbol name="credit-card" size={80} color={isDark ? '#4A4A4A' : '#E0E0E0'} />
                <ThemedText style={styles.emptyTitle}>No eSIMs</ThemedText>
                <ThemedText style={styles.emptyDesc}>You haven't purchased any eSIMs yet. Buy one to get started.</ThemedText>
                <AppButton title="Buy eSIM" onPress={handleBuy} style={styles.buyPrimary} />
              </View>
            )}
            onRefresh={fetchEsims}
            refreshing={loading}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

function getStatusColor(status?: string, isDark = false) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'received':
      return '#4CAF50';
    case 'active':
      return '#2196F3';
    case 'expired':
      return '#FF9800';
    case 'pending':
      return '#FFC107';
    default:
      return isDark ? '#9BA1A6' : '#687076';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  subtitle: { marginTop: 4, opacity: 0.75 },
  buyBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  emptyDesc: { textAlign: 'center', opacity: 0.75, marginTop: 8, lineHeight: 22 },
  buyPrimary: { marginTop: 20, paddingHorizontal: 36 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  cardContainer: { marginBottom: 14 },
  card: { borderRadius: 12, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  phone: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 13, opacity: 0.75 },
  status: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 14, opacity: 0.7 },
  detailValue: { fontSize: 14, fontWeight: '600' },
});
