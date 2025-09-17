import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useThemeColor } from '@/hooks/useThemeColor';
import { esimService } from '@/services/apiService';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';

export default function OperatorsByCountry() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const country = (params.country as string) || '';
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // theme-aware colors
  const cardBg = useThemeColor({}, 'background');
  const imagePlaceholderBg = useThemeColor({ light: '#f3f3f3', dark: '#2D2D2D' }, 'background');
  const retryBg = useThemeColor({}, 'tint');
  const retryTextColor = useThemeColor({ light: '#ffffff', dark: '#000000' }, 'text');

  useEffect(() => {
    navigation.setOptions?.({
      title: `Operators (${country.toUpperCase()})`,
      headerShown: true,
      headerBackTitleVisible: false,
    });
  }, [navigation, country]);

  const loadOperators = useCallback(async () => {
    if (!country) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await esimService.getAiraloOperators(country);
      if (resp?.success) {
        setOperators(resp.data || []);
      } else {
        setOperators([]);
        setError(resp?.message || resp?.error || 'Failed to load operators');
      }
    } catch (err: any) {
      setOperators([]);
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  const renderEmpty = () => (
    <ThemedView style={styles.empty}>
      <ThemedText type="subtitle" style={styles.emptyText}>
        {error
          ? error
          : `No operators found for ${country.toUpperCase()}.`}
      </ThemedText>
      {error && (
        <Pressable style={[styles.retryButton, { backgroundColor: retryBg }]} onPress={loadOperators}>
          <ThemedText style={[styles.retryText, { color: retryTextColor }]}>Retry</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [{ backgroundColor: cardBg }, styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        router.push(`/esim/operators/packages/${item.id}?country=${encodeURIComponent(String(country))}` as any)
      }
    >
      {item.image?.url ? (
        <Image
          source={{ uri: item.image.url }}
          style={[styles.cardImage, { backgroundColor: imagePlaceholderBg }]}
          resizeMode="contain"
        />
      ) : (
        <ThemedView style={[styles.cardImagePlaceholder, { backgroundColor: imagePlaceholderBg }] }>
          <ThemedText>📡</ThemedText>
        </ThemedView>
      )}
      <View style={styles.cardBody}>
        <ThemedText type="title" style={styles.cardTitle}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.cardSubtitle}>
          {item.esim_type || 'eSIM'} · {item.packages_count ?? 0} packages
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    // <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {loading && operators.length === 0 ? (
          <FSActivityLoader />
        ) : (
          <FlatList
            data={operators}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={
              operators.length === 0 && !loading ? { flex: 1 } : { paddingBottom: 24 }
            }
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadOperators} />
            }
            renderItem={renderItem}
            ListEmptyComponent={!loading ? renderEmpty : null}
          />
        )}
      </ThemedView>
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
  },
  cardPressed: { opacity: 0.85 },
  cardImage: { width: 64, height: 64, borderRadius: 8 },
  cardImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { marginTop: 4, fontSize: 14, opacity: 0.7 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: { marginBottom: 16, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { fontWeight: '600' },
});
