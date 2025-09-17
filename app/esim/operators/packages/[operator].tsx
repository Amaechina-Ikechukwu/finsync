import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import TransactionPinModal from '@/components/TransactionPinModal';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useThemeColor } from '@/hooks/useThemeColor';
import { esimService } from '@/services/apiService';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OperatorPackages() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const country = (params.country as string) || '';
  const operatorId = (params.operator as string) || (params.operator as any) || '';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPurchaseAlert, setShowPurchaseAlert] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // theme-aware colors
  const cardBg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const altBg = useThemeColor({ light: '#eee', dark: '#2D2D2D' }, 'background');
  const retryTextColor = useThemeColor({ light: '#ffffff', dark: '#000000' }, 'text');

  function formatNaira(value: number | string | undefined) {
    if (value === undefined || value === null) return '—';
    const n = Number(value) || 0;
    return n.toLocaleString('en-NG');
  }

  function stripHtml(html?: string | null) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Try to load react-native-render-html if available for rich rendering
  let RenderHtml: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    RenderHtml = require('react-native-render-html').default;
  } catch (e) {
    RenderHtml = null;
  }
  const { width: contentWidth } = Dimensions.get('window');

  const load = useCallback(async () => {
    if (!country || !operatorId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await esimService.getAiraloPackages(country, operatorId);
      if (resp?.success) {
        setPackages(resp.data || []);
      } else {
        setPackages([]);
        setError(resp?.message || resp?.error || 'Failed to load packages');
      }
    } catch (err: any) {
      setPackages([]);
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [country, operatorId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // use native header for this screen
    navigation.setOptions?.({
      title: operatorId ? `Packages (${country.toUpperCase()})` : 'Packages',
      headerShown: true,
      headerBackTitleVisible: false,
    });
  }, [navigation, operatorId]);

  const handlePackagePress = (item: any) => {
    setSelectedPackage(item);
    setShowPurchaseAlert(true);
  };

  const handlePurchaseConfirm = () => {
    setShowPurchaseAlert(false);
    setShowPinModal(true);
  };

  const processPurchase = async (pin: string) => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    setShowPinModal(false);
    showNotification('Processing eSIM purchase...', 'info');
    
    try {
      const response = await esimService.purchasePackage(selectedPackage.id, operatorId);
      
      if (response.success) {
        showNotification('eSIM purchased successfully!', 'success');
        // Navigate to success page with purchase details
        router.push({
          pathname: '/esim/success',
          params: {
            packageTitle: selectedPackage.title,
            packagePrice: (selectedPackage.price_ngn ?? selectedPackage.price).toString(),
            country: country,
            operatorName: selectedPackage.operator_info?.title || operatorId.toString(),
            packageData: selectedPackage.data || 'N/A',
            packageDays: selectedPackage.day?.toString() || 'N/A',
            orderReference: response.data?.orderReference || response.data?.reference || 'ESIM-' + Date.now(),
            qrCode: selectedPackage.qr_installation || ''
          }
        });
      } else {
        showNotification(response.message || 'Purchase failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showNotification('Purchase failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
  
      <ThemedView style={styles.container}>
        {/* <View style={styles.header}>
          <ThemedText style={styles.title}>Packages</ThemedText>
          <ThemedText style={[styles.subtitle, { color: textColor, opacity: 0.8 }]}>{String(country).toUpperCase()}</ThemedText>
        </View> */}

        <FlatList
          data={packages}
          keyExtractor={(p) => String(p.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={packages.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
            renderItem={({ item }) => (
            <Pressable style={[styles.packageCard, { backgroundColor: cardBg }]} onPress={() => handlePackagePress(item)}>
              <View style={styles.packageRow}>
                <ThemedText style={[styles.packageTitle, { color: textColor }]}>{item.title}</ThemedText>
                <ThemedText style={[styles.packagePrice, { color: textColor }]}>₦{formatNaira(item.price_ngn ?? item.price)}</ThemedText>
              </View>
              {/* <ThemedText style={styles.packageMeta}>{item.data ?? ''} · {item.day} days</ThemedText> */}
              <View style={{ marginTop: 8, flexDirection: 'row' }}>
                <Pressable style={[styles.infoButton, { backgroundColor: altBg }]} onPress={() => { setSelected(item); setModalVisible(true); }}>
                  <ThemedText style={[styles.infoButtonText, { color: textColor }]}>More info</ThemedText>
                </Pressable>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              {loading ? (
                < FSActivityLoader  />
              ) : error ? (
                <>
                  <ThemedText style={[styles.emptyText, { color: textColor }]}>{error}</ThemedText>
                  <Pressable style={[styles.retryButton, { backgroundColor: tint }]} onPress={load}>
                    <ThemedText style={[styles.retryText, { color: retryTextColor }]}>Retry</ThemedText>
                  </Pressable>
                </>
              ) : (
                <ThemedText style={[styles.emptyText, { color: textColor }]}>No packages found.</ThemedText>
              )}
            </View>
          )}
        />
        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <ThemedText type="title" style={styles.infoTitle}>{selected?.title ?? 'Package details'}</ThemedText>
                <ThemedText style={{ marginTop: 8, color: textColor }}>Price: ₦{formatNaira(selected?.price_ngn ?? selected?.price)}</ThemedText>
                {selected?.short_info ? <ThemedText style={styles.infoBody}>{stripHtml(selected.short_info)}</ThemedText> : null}
                <ThemedText type="subtitle" style={{ marginTop: 12 }}>Installation (QR)</ThemedText>
                {selected?.qr_installation ? (
                  RenderHtml ? (
                    <RenderHtml contentWidth={contentWidth - 32} source={{ html: selected.qr_installation }} />
                  ) : (
                    <ThemedText style={styles.infoBody}>{stripHtml(selected.qr_installation)}</ThemedText>
                  )
                ) : (
                  <ThemedText style={styles.infoBody}>N/A</ThemedText>
                )}

                <ThemedText type="subtitle" style={{ marginTop: 12 }}>Manual installation</ThemedText>
                {selected?.manual_installation ? (
                  RenderHtml ? (
                    <RenderHtml contentWidth={contentWidth - 32} source={{ html: selected.manual_installation }} />
                  ) : (
                    <ThemedText style={[styles.infoBody, { color: textColor }]}>{stripHtml(selected.manual_installation)}</ThemedText>
                  )
                ) : (
                  <ThemedText style={[styles.infoBody, { color: textColor }]}>N/A</ThemedText>
                )}
              </ScrollView>
              <AppButton title='Close' variant='coral' onPress={()=>setModalVisible(false)} />
            </ThemedView>
          </SafeAreaView>
        </Modal>

        {/* Purchase Confirmation Alert */}
        <CustomAlert
          visible={showPurchaseAlert}
          title="Purchase eSIM Package"
          message={selectedPackage ? `Do you want to purchase ${selectedPackage.title} for ₦${formatNaira(selectedPackage.price_ngn ?? selectedPackage.price)}?` : ''}
          icon="receipt"
          buttons={[
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setShowPurchaseAlert(false)
            },
            {
              text: 'Purchase',
              style: 'default',
              onPress: handlePurchaseConfirm
            }
          ]}
          onRequestClose={() => setShowPurchaseAlert(false)}
        />

        {/* Transaction PIN Modal */}
        <TransactionPinModal
          visible={showPinModal}
          onClose={() => setShowPinModal(false)}
          onPinEntered={processPurchase}
          isProcessing={isProcessing}
          title="Enter Transaction PIN"
          subtitle="Please enter your 4-digit transaction PIN to complete the purchase"
        />
      </ThemedView>
   
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 0 },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { marginBottom: 12 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryText: { fontWeight: '600' },
  infoButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  infoButtonText: {  },
  modalContainer: { flex: 1 },
  infoTitle: { fontSize: 18, fontWeight: '700' },
  infoSubtitle: { marginTop: 8, fontWeight: '600' },
  infoBody: { marginTop: 8 },
  packageCard: { padding: 12, borderRadius: 8, marginBottom: 12 },
  packageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  packageTitle: { fontWeight: '600' },
  packagePrice: { fontWeight: '700' },
  packageMeta: { marginTop: 6 },
  emptyContainer: { flex: 1 },
});
