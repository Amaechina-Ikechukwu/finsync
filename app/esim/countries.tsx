import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import apiClient from '@/services/apiClient';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CountryItem {
  slug: string;
  country_code: string;
  title: string;
  image?: { url: string; width?: number; height?: number };
  operators_count?: number;
}

export default function EsimCountriesScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries();
  // set native header
  navigation.setOptions?.({ title: 'eSIM Countries', headerShown: true, headerBackTitleVisible: false });
  }, []);

  async function fetchCountries() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CountryItem[]>('/airalo/countries');

      if (res && (res as any).success === true && Array.isArray((res as any).data)) {
        setCountries((res as any).data as CountryItem[]);
      } else if (res && (res as any).data && Array.isArray((res as any).data)) {
        // Some endpoints return the raw array directly
        setCountries((res as any).data as CountryItem[]);
      } else if (Array.isArray(res)) {
        // fallback: apiClient may return raw array
        setCountries(res as unknown as CountryItem[]);
      } else {
        setError('Failed to load countries');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function handlePress(item: CountryItem) {
    // Assumption: operators page accepts a `country` query param. If your route differs,
    // update this to match (e.g. `/esim/operators/${item.slug}`).
  // Navigate to dynamic route file at /app/esim/operators/[country].tsx
  router.push({ pathname: '/esim/operators/[country]', params: { country: item.slug } } as any);
  }

  const renderItem = ({ item }: { item: CountryItem }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => handlePress(item)}>
      {/* <View style={styles.left}>
        {item.image?.url ? (
          <Image source={{ uri: item.image.url }} style={styles.flag} resizeMode="cover" />
        ) : (
          <View style={[styles.flag, { backgroundColor: colorScheme === 'dark' ? '#333' : '#eee' }]} />
        )}
      </View> */}
      <View style={styles.middle}>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.subtitle}>{(item.operators_count ?? 0) + ' operator(s)'}</ThemedText>
      </View>
      <View style={styles.right}>
        <IconSymbol name="chevron.right" size={20} color={colorScheme === 'dark' ? '#fff' : '#222'} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <ThemedText>{error}</ThemedText>
            </View>
          ) : (
            <FlatList
              data={countries}
              keyExtractor={(i) => i.slug}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <ThemedText>No countries found.</ThemedText>
                </View>
              )}
              onRefresh={fetchCountries}
              refreshing={loading}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0,
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20 },
  headerSpacer: { width: 40 },
  content: { flex: 1, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  left: { width: 64, alignItems: 'center', justifyContent: 'center' },
  flag: { width: 56, height: 40, borderRadius: 6, overflow: 'hidden' },
  middle: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, opacity: 0.8, marginTop: 4 },
  right: { width: 36, alignItems: 'flex-end' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#DDD' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 24 },
});
