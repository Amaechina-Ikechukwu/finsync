import { ThemedText } from '@/components/ThemedText';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useThemeColor } from '@/hooks/useThemeColor';
import { nairaCardService } from '@/services/apiService';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, useColorScheme, View } from 'react-native';

// Transaction type based on expected API payload
export type NairaTxn = {
  id: string;
  card_id: string;
  currency: 'NGN' | string;
  merchant?: { name?: string } | null;
  reference: string;
  savedAt: string;
  transaction_date: string;
  transaction_id: string;
  txId: string;
  type: string;
  flow: 'debit' | 'credit' | string;
  // Optional fields that may appear
  amount?: number;
  status?: string;
  description?: string;
};

export type PageParams = { limit: number; offset: number; sort: 'asc' | 'desc' };

const DEFAULT_PAGE: PageParams = { limit: 50, offset: 0, sort: 'desc' };

export default function NairaCardTransactions() {
  const tint = useThemeColor({}, 'tint');
  const isDark = useColorScheme() === 'dark';
  const cardBg = isDark ? '#2D2D2D' : '#f5f5f5';
  const subColor = isDark ? 'rgba(229,231,235,0.7)' : 'rgba(55,65,81,0.8)';

  const [items, setItems] = useState<NairaTxn[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = useRef<PageParams>({ ...DEFAULT_PAGE });
  const isFetchingRef = useRef(false);
  const noMoreRef = useRef(false);
  const reachedEnd = useMemo(
    () => (typeof total === 'number' ? items.length >= total : noMoreRef.current),
    [items.length, total]
  );

  const fetchPage = useCallback(async (reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const params = reset ? { ...DEFAULT_PAGE } : { ...page.current };
      const res = await nairaCardService.getTransactionsDb(params);
      if (res.success && (res as any).data) {
        const payload = res as any;
        const data = (payload.data || []) as NairaTxn[];
        const totalCount = payload.total as number | undefined;
        setTotal(totalCount);
        setItems((prev) => (reset ? data : [...prev, ...data]));
        const added = Array.isArray(data) ? data.length : 0;
        const nextOffset = (params.offset ?? 0) + added;
        page.current = { ...params, offset: nextOffset };
        if (typeof totalCount !== 'number' && added === 0) {
          noMoreRef.current = true;
        } else if (
          typeof totalCount === 'number' && (reset ? data.length : items.length + data.length) >= totalCount
        ) {
          noMoreRef.current = true;
        }
      } else {
        setError((res as any).message || (res as any).error || 'Failed to load transactions');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [items.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    page.current = { ...DEFAULT_PAGE };
    noMoreRef.current = false;
    await fetchPage(true);
    setRefreshing(false);
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (loading || refreshing || reachedEnd) return;
    fetchPage(false);
  }, [fetchPage, loading, refreshing, reachedEnd]);

  useEffect(() => {
    fetchPage(true);
  }, [fetchPage]);

  const titleCase = useCallback((s?: string) => {
    if (!s) return '';
    const normalized = String(s).replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return normalized
      .split(' ')
      .map((w) => ( /^[A-Z]{2,}$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(' ');
  }, []);

  const renderItem = useCallback(({ item }: { item: NairaTxn }) => {
    const sign = item.flow === 'credit' ? '+' : '-';
    const name = item.merchant?.name || item.type || 'Transaction';
    const amount = typeof item.amount === 'number' ? item.amount : 0;
    const amountStr = `${sign}₦${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    const dateStr = new Date(item.transaction_date || item.savedAt).toLocaleString();
    const amountColor = item.flow === 'credit' ? '#10b981' : '#ef4444';
    const statusLower = String(item.status || '').toLowerCase();
    const chipBg =
      statusLower === 'failed'
        ? 'rgba(239,68,68,0.15)'
        : statusLower === 'success'
        ? 'rgba(16,185,129,0.15)'
        : 'rgba(107,114,128,0.15)';
    const chipText =
      statusLower === 'failed' ? '#ef4444' : statusLower === 'success' ? '#10b981' : '#6b7280';

    return (
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.rowLeft}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {titleCase(name)}
          </ThemedText>
          <Text style={[styles.subtitle, { color: subColor }]} numberOfLines={1}>
            {dateStr}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.amount, { color: amountColor }]}>{amountStr}</Text>
          <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
            <Text style={[styles.statusText, { color: chipText }]}> {titleCase(item.type)} </Text>
          </View>
        </View>
      </View>
    );
  }, [cardBg, subColor, titleCase]);

  const keyExtractor = useCallback(
    (item: NairaTxn) => item.id || item.txId || item.transaction_id,
    []
  );

  const ListEmpty = useCallback(() => (
    <View style={styles.center}>
      {loading ? <FSActivityLoader /> : <ThemedText>No transactions yet</ThemedText>}
    </View>
  ), [loading, tint]);

  const ListFooter = useCallback(() => {
    if (loading && items.length > 0) {
      return (
        <View style={styles.footer}>
          <FSActivityLoader />
        </View>
      );
    }
    if (reachedEnd && items.length > 0) {
      return (
        <View style={styles.footer}>
          <ThemedText style={{ opacity: 0.6 }}>End of list</ThemedText>
        </View>
      );
    }
    return null;
  }, [items.length, loading, reachedEnd, tint]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {error ? (
        <View style={[styles.center, { padding: 16 }]}>
          <ThemedText style={{ color: '#ef4444', marginBottom: 8 }}>{error}</ThemedText>
          <Text style={{ color: tint }} onPress={() => fetchPage(true)}>
            Retry
          </Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? { flexGrow: 1, padding: 12 } : { padding: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  amount: {
    fontWeight: '700',
  },
  statusChip: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'none',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
