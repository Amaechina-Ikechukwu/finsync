import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useColorScheme } from '@/hooks/useColorScheme';
import { accountService, nairaCardService } from '@/services/apiService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface PhysicalDetails {
  available_balance?: string;
  cardId?: string;
  card_brand?: string;
  card_created_date?: string;
  card_id?: string;
  card_status?: string;
  card_type?: string;
  card_user_id?: string;
  card_variant?: string;
  createdAt?: string;
  currency?: string;
  customer_id?: string;
  ledger_balance?: string;
  reference?: string;
  updatedAt?: string;
}

export default function PhysicalCardUI() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<PhysicalDetails | null>(null);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [tx, setTx] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [kycRes, detRes, txRes] = await Promise.all([
          accountService.getIdentityStatus(),
          nairaCardService.getPhysicalDetails(),
          nairaCardService.getPhysicalTransactions(),
        ]);

        if (kycRes.success && kycRes.data) setKycVerified(Boolean(kycRes.data.verified));
        if (detRes.success && detRes.data) setDetails(detRes.data as any);
        if (txRes.success && txRes.data) setTx((txRes as any).data || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <FSActivityLoader />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  // If no physical card details and KYC verified -> prompt to create
  if (!details && kycVerified) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={styles.title}>Create your Physical Naira Card</ThemedText>
        <ThemedText style={styles.subtitle}>Your KYC is verified. Create a physical card and wait for admin approval.</ThemedText>
        <View style={{ height: 12 }} />
        <AppButton title="Create Physical Card" onPress={() => router.push('/cards/naira/create-naira-card')} />
      </ThemedView>
    );
  }

  // If no physical card and KYC not verified -> suggest KYC first
  if (!details && kycVerified === false) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={styles.title}>Complete KYC</ThemedText>
        <ThemedText style={styles.subtitle}>Verify your identity to request a physical card.</ThemedText>
        <View style={{ height: 12 }} />
        <AppButton title="Start KYC" onPress={() => router.push('/settings/kyc-nin')} />
      </ThemedView>
    );
  }

  // Show physical card details
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
          <ThemedText style={styles.cardTitle}>{details?.card_brand || 'AfriGo'} Physical</ThemedText>
          <View style={styles.row}><ThemedText>Status:</ThemedText><ThemedText>{details?.card_status || '—'}</ThemedText></View>
          <View style={styles.row}><ThemedText>Available:</ThemedText><ThemedText>₦{details?.available_balance ?? '0.00'}</ThemedText></View>
          <View style={styles.row}><ThemedText>Ledger:</ThemedText><ThemedText>₦{details?.ledger_balance ?? '0.00'}</ThemedText></View>
          <View style={styles.row}><ThemedText>Card ID:</ThemedText><ThemedText selectable>{details?.card_id || details?.cardId || '—'}</ThemedText></View>
          <View style={styles.row}><ThemedText>Created:</ThemedText><ThemedText>{details?.card_created_date || details?.createdAt || '—'}</ThemedText></View>
        </View>

        <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>Transactions</ThemedText>
        {tx.length === 0 ? (
          <ThemedText style={{ opacity: 0.7 }}>No transactions found</ThemedText>
        ) : (
          tx.map((t, idx) => (
            <View key={idx} style={styles.txRow}>
              <Text style={{ fontWeight: '600' }}>{t.description || t.reference || 'Transaction'}</Text>
              <Text>{t.amount ?? ''}</Text>
              <Text style={{ opacity: 0.6 }}>{t.status || ''}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  subtitle: { marginTop: 6, opacity: 0.8, textAlign: 'center' },
  card: { padding: 16, borderRadius: 14 },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { fontWeight: '700' },
  txRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
});
