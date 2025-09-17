import { ThemedView } from '@/components/ThemedView';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import type { ReloadlyProduct } from '@/services/apiService';

interface Card extends ReloadlyProduct {}

const OnlineCardList: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const loadingRef = useRef(false);
  const PAGE_SIZE = 20;
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Gift Cards',
      headerShown: true,
    });
  }, [navigation]);

  const fetchCards = useCallback(async (reset = false, search = query, nextPage = page) => {
    if (loadingRef.current && !reset) return; // Allow reset even when loading
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      };
      if (search) params.search = search;
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('size', params.limit.toString());
      if (params.offset) queryParams.append('page', (Math.floor(params.offset / (params.limit || 1))).toString());
      if (params.country) queryParams.append('countryCode', params.country);
      if (params.categoryId) queryParams.append('productCategoryId', params.categoryId.toString());
      if (params.search) queryParams.append('productName', params.search);
      if (params.includeRange !== undefined) queryParams.append('includeRange', params.includeRange ? 'true' : 'false');
      if (params.includeFixed !== undefined) queryParams.append('includeFixed', params.includeFixed ? 'true' : 'false');
      const queryString = queryParams.toString();
      
      // Use environment variable for API URL
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const endpoint = `${apiUrl}/reloadly/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint);
      const res = await response.json();
      if (res.success && Array.isArray(res.data)) {
        setCards(reset ? res.data : prev => [...prev, ...res.data]);
        setHasMore(res.data.length === PAGE_SIZE);
      } else {
        setError(res.error || 'Failed to load cards');
      }
    } catch (err) {
      setError('Failed to load cards');
    }
    loadingRef.current = false;
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchCards(true, query, 0);
    setPage(0);
  }, [query, fetchCards]);

  const handleEndReached = () => {
    if (!loadingRef.current && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCards(false, query, nextPage);
    }
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#a8edea', '#fed6e3'],
      ['#ffecd2', '#fcb69f'],
      ['#667eea', '#764ba2'],
    ];
    return gradients[index % gradients.length];
  };

  const renderItem = ({ item, index }: { item: Card; index: number }) => {
    const logoUrl = item.logoUrls?.[0];
    const orderId = item.productId?.toString() || 'unknown';
    const transactionId = item.productId?.toString(); // Using productId as fallback
    const gradientColors = getCardGradient(index) as [string, string];
    const isDark = colorScheme === 'dark';
    const cardBg = isDark ? '#1a1a1a' : '#ffffff';
    const textPrimary = isDark ? '#ffffff' : '#1a1a1a';
    const textSecondary = isDark ? '#b3b3b3' : '#666666';
    const shadowColor = isDark ? '#000000' : '#000000';
    return (
      <Pressable
        style={[styles.cardContainer, { backgroundColor: cardBg, shadowColor }]}
        android_ripple={{ color: isDark ? '#333' : '#f0f0f0' }}
        onPress={() => router.push({ pathname: '/giftcards/details', params: { orderId, transactionId } })}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardHeader,{  borderTopRightRadius: 20,borderTopLeftRadius:20}]}
        >
          {logoUrl ? (
            <ImageBackground
              source={{ uri: logoUrl }}
              style={styles.logoContainer}
              imageStyle={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <MaterialIcons name="card-giftcard" size={32} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          <View style={styles.decorativePattern}>
            <View style={styles.patternDot} />
            <View style={styles.patternDot} />
            <View style={styles.patternDot} />
          </View>
        </LinearGradient>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={[styles.brandName, { color: textSecondary }]} numberOfLines={1}>
              {item.brand?.brandName || 'Unknown Brand'}
            </Text>
            <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={2}>
              {item.productName || 'Unknown Product'}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, { color: textPrimary }]}>
                {item.senderCurrencyCode || 'USD'} {item.minSenderDenomination || 0} - {item.maxSenderDenomination || 0}
              </Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: item.status === 'ACTIVE' ? '#dcfce7' : (isDark ? '#374151' : '#f3f4f6') }
            ]}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: item.status === 'ACTIVE' ? '#16a34a' : '#6b7280' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: item.status === 'ACTIVE' ? '#16a34a' : '#6b7280' }
              ]}>
                {item.status === 'ACTIVE' ? 'Available' : item.status}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <FSActivityLoader />
        <Text style={[styles.loadingText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Loading your gift cards...</Text>
      </ThemedView>
    );
  }
  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={[styles.errorText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{error}</Text>
      </ThemedView>
    );
  }
  return (
    <ThemedView style={styles.container}>
      {/* Add a search input if you want to support querying */}
      {/* <TextInput value={query} onChangeText={setQuery} placeholder="Search cards..." /> */}
      <FlatList
        data={cards}
        keyExtractor={item => item.productId?.toString() || 'unknown'}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="card-giftcard" size={64} color="#9ca3af" />
            <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>No gift cards found</Text>
            <Text style={[styles.emptySubtext, { color: colorScheme === 'dark' ? '#6b7280' : '#9ca3af' }]}>Your purchased gift cards will appear here</Text>
          </View>
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '500' },
  errorText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  listContainer: { padding: 16, paddingTop: 24 },
  cardContainer: { borderRadius: 20, marginBottom: 20 },
  cardHeader: { height: 120, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: '100%', height: '100%', borderTopRightRadius: 20, borderTopLeftRadius: 20 },
  logoPlaceholder: { width: 80, height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  decorativePattern: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', gap: 8 },
  patternDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  cardContent: { padding: 20 },
  cardInfo: { marginBottom: 16 },
  brandName: { fontSize: 14, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  productName: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountContainer: { flex: 1 },
  amount: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default OnlineCardList;
