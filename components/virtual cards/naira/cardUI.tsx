import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import TransactionPinModal from '@/components/TransactionPinModal';
import TransactionPinSetupModal from '@/components/TransactionPinSetupModal';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import apiClient from '@/services/apiClient';
import { nairaCardService } from '@/services/apiService';
import { useAppStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NairaCardTransactions from './NairaCardTransactions';

type BillingAddress = {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
};

type NairaCardData = {
  card_number: string;
  cvv?: string;
  expiry_month?: string;
  expiry_year?: string;
  card_type?: string;
  card_brand?: string;
  default_pin?: string;
  status?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: BillingAddress;
};

type Props = {
  // optional callback when user taps Create Card
  onCreate?: () => void;
};

export default function NairaCardUI({ onCreate }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NairaCardData | null>(null);
  const [showCvv, setShowCvv] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);
  const [showPinVerify, setShowPinVerify] = useState<boolean>(false);
  const [pinProcessing, setPinProcessing] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<((pin: string) => void | Promise<void>) | null>(null);
  const { userData, setUserData } = useAppStore();

  const cardWidth = Math.round(Dimensions.get('window').width * 0.9);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { showConfirm, showError, showSuccess, alertState, hideAlert } = useCustomAlert();

  // neutral monochrome palette for dark/light modes
  const neutralLight = '#f3f4f6';
  const neutralDark = '#0f1724';
  const neutralTextLight = '#111827';
  const neutralTextDark = '#e5e7eb';
  const neutralMutedLight = '#6b7280';
  const neutralMutedDark = '#9ca3af';

  const cardBg = isDark ? neutralDark : neutralLight;
  const infoValueColor = isDark ? neutralTextDark : neutralTextLight;
  const infoLabelColor = isDark ? neutralMutedDark : neutralMutedLight;
  const emptyBg = isDark ? '#0b1117' : '#fff';
  const emptyBorder = isDark ? '#1f2937' : '#e5e7eb';
  const emptyTextColor = isDark ? neutralMutedDark : neutralMutedLight;
  const detailsBtnBg = isDark ? '#111827' : '#fff';
  const detailsBtnText = isDark ? neutralTextDark : neutralTextLight;
  const modalBg = isDark ? '#0b1117' : '#fff';
  const modalTextColor = isDark ? neutralTextDark : neutralTextLight;
  const modalBackdropColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';

  // Colors on the card surface
  const onCardTextColor = isDark ? '#fff' : '#111827';
  const onCardSubtleColor = isDark ? '#e6f0ff' : '#374151';
  // Use state-aware tint so the icon visually reflects freeze status
  const onCardIconColor = isFrozen ? '#FF6B6B' : '#4ECDC4';
  const onCardBorderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(17,24,39,0.2)';

  // fetchData is exposed so we can trigger it from retry button
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<NairaCardData>('/naira-card/details');

      // Some backends wrap the payload at data.data or return ApiResponse directly
      // Support both shapes defensively.
      if (res && (res as any).success === true && (res as any).data) {
     
        setData((res as any).data as NairaCardData);
      } else if ((res as any).card_number) {
        
        setData(res as any as NairaCardData);
      } else {
        setData(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load card');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchData();
      // also fetch freeze status initially
      (async () => {
        try {
          const res = await nairaCardService.getFreezeStatus();
          if (res?.success && res.data) {
            const status = String(res.data.status || '').toLowerCase();
            const frozen = Boolean(res.data.frozen) || (!!status && status !== 'active');
            setIsFrozen(Boolean(frozen));
          }
        } catch {}
      })();
    }
    return () => {
      mounted = false;
    };
  }, []);

  const ensureTransactionPin = useCallback((): boolean => {
    if (!userData?.hasTransactionPin) {
      setShowPinSetup(true);
      return false;
    }
    return true;
  }, [userData]);

  const requirePinThen = useCallback((action: (pin: string) => void | Promise<void>) => {
    if (!ensureTransactionPin()) return;
    setPendingAction(() => action);
    setShowPinVerify(true);
  }, [ensureTransactionPin]);

  const maskedNumber = (num?: string) => {
    if (!num) return '•••• •••• •••• ••••';
    const clean = num.replace(/\s+/g, '');
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const maskCardNumber = (num?: string, show?: boolean) => {
    if (!num) return '•••• •••• •••• ••••';
    const clean = num.replace(/\s+/g, '');
    if (show) return clean.replace(/(.{4})/g, '$1 ').trim();
    const last4 = clean.slice(-4).padStart(4, '•');
    return `•••• •••• •••• ${last4}`;
  };

  const onPressCreate = () => {
    if (onCreate) return onCreate();
    // Default: navigate to create screen (expo-router)
    try {
      router.push('/cards/naira/create');
      return;
    } catch (e) {
      Alert.alert('Create card', 'No create action provided. Hook up `onCreate` to start card creation.');
    }
  };

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
        <ThemedText style={styles.error}>{error}</ThemedText>
  <TouchableOpacity style={styles.button} onPress={() => { fetchData(); }}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // No card
  if (!data) {
    return (
      <ThemedView style={[styles.container,{alignItems:'center',justifyContent:"center"}]}>
        <View style={[styles.emptyCard, styles.emptyCenter, { width:"100%" }]}> 
          <TouchableOpacity
            style={[styles.plusWrap, { backgroundColor: detailsBtnBg }]}
            onPress={onPressCreate}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create Naira card"
          >
            <Ionicons name="add" size={56} color={isDark ? neutralTextDark : neutralTextLight} />
          </TouchableOpacity>
          

          <AppButton title="Create Naira Card" onPress={onPressCreate} variant={isDark ? 'white' : 'dark'}  />
        </View>
      </ThemedView>
    );
  }

  // Card exists — render details
  return (
    <ThemedView style={styles.container}>
  <View style={[styles.cardContainer, { width: cardWidth, backgroundColor: cardBg }]}> 
        <View style={styles.cardTop}>
          <View style={styles.topRightRow}>
            <Text style={[styles.brand, { color: onCardTextColor }]}>{data.card_brand || data.card_type || 'NAIRA'}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isFrozen ? 'Unfreeze card' : 'Freeze card'}
              onPress={() => {
                requirePinThen((_pin) => {
                  if (busy) return;
                  const nextLabel = !isFrozen;
                  showConfirm(
                    nextLabel ? 'Freeze card?' : 'Unfreeze card?',
                    nextLabel ? 'You can unfreeze anytime.' : 'Card will become active again.',
                    async () => {
                      try {
                        setBusy(true);
                        // Determine desired action using latest server status
                        let desired: boolean = !isFrozen;
                        try {
                          const cur = await nairaCardService.getFreezeStatus();
                          if (cur?.success && cur.data) {
                            const status = String(cur.data.status || '').toLowerCase();
                            const frozenNow = Boolean(cur.data.frozen) || (!!status && status !== 'active');
                            desired = !Boolean(frozenNow);
                          }
                        } catch {}

                        const res = await nairaCardService.toggleFreeze(desired);
                        if (res.success) {
                          // Re-check from server and set UI from that
                          try {
                            const check = await nairaCardService.getFreezeStatus();
                            if (check.success && check.data) {
                              const status = String(check.data.status || '').toLowerCase();
                              const frozen = Boolean(check.data.frozen) || (!!status && status !== 'active');
                              setIsFrozen(Boolean(frozen));
                            } else {
                              setIsFrozen(desired);
                            }
                          } catch {
                            setIsFrozen(desired);
                          }
                          showSuccess(desired ? 'Card frozen' : 'Card unfrozen');
                        } else {
                          showError('Action failed', (res as any).message || (res as any).error || 'Please try again.');
                        }
                      } catch (e: any) {
                        showError('Action failed', e?.message || 'Please try again.');
                      } finally {
                        setBusy(false);
                      }
                    }
                  );
                });
              }}
              style={[styles.freezeBtn, { borderColor: onCardBorderColor }]}
              activeOpacity={0.8}
            >
              <Ionicons name={isFrozen ? 'snow-outline' : 'snow'} size={18} color={onCardIconColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.cardNumber, { color: onCardTextColor }]}>{maskCardNumber(data.card_number, showNumber)}</Text>
            <TouchableOpacity
              onPress={() => {
                requirePinThen((_pin) => setShowNumber((s) => !s));
              }}
              accessibilityRole="button"
              accessibilityLabel={showNumber ? 'Hide card number' : 'Show card number'}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name={showNumber ? 'eye-off' : 'eye'} size={18} color={onCardIconColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={[styles.smallLabel, { color: onCardSubtleColor }]}>Cardholder</Text>
            <Text style={[styles.value, { color: onCardTextColor }]}>{data.customer_name || '—'}</Text>
          </View>

          <View>
            <Text style={[styles.smallLabel, { color: onCardSubtleColor }]}>Expires</Text>
            <Text style={[styles.value, { color: onCardTextColor }]}>{(data.expiry_month || '--') + '/' + (data.expiry_year ? String(data.expiry_year).slice(-2) : '--')}</Text>
          </View>

          <View>
            <Text style={[styles.smallLabel, { color: onCardSubtleColor }]}>CVV</Text>
            <TouchableOpacity onPress={() => {
              requirePinThen((_pin) => setShowCvv((s) => !s));
            }}>
              <Text style={[styles.value, { color: onCardTextColor }]}>{showCvv ? data.cvv ?? data.default_pin ?? '•••' : '•••'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.detailsButton, { backgroundColor: detailsBtnBg }]} onPress={() => {
            requirePinThen((_pin) => setDetailsVisible(true));
          }}>
            <Text style={[styles.detailsButtonText, { color: detailsBtnText }]}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Details modal */}
      <Modal visible={detailsVisible} animationType="slide" transparent={true} onRequestClose={() => setDetailsVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: modalBackdropColor }]}> 
          <View style={[styles.modalContainer, { backgroundColor: modalBg }]}> 
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={[styles.modalTitle, { color: modalTextColor }]}>Card details</Text>

              <Text style={[styles.infoLabel, { color: infoLabelColor }]}>Email</Text>
              <Text style={[styles.infoValue, { color: infoValueColor }]}>{data.customer_email || '—'}</Text>

              <Text style={[styles.infoLabel, { color: infoLabelColor }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: infoValueColor }]}>{data.customer_phone || '—'}</Text>

              <Text style={[styles.infoLabel, { color: infoLabelColor }]}>Billing address</Text>
              <Text style={[styles.infoValue, { color: infoValueColor }]}>{data.billing_address ? `${data.billing_address.line1 || ''}${data.billing_address.city ? ', ' + data.billing_address.city : ''}${data.billing_address.state ? ', ' + data.billing_address.state : ''}${data.billing_address.country ? ', ' + data.billing_address.country : ''}` : '—'}</Text>

              <Pressable style={[styles.closeButton, { backgroundColor: detailsBtnBg }]} onPress={() => setDetailsVisible(false)}>
                <Text style={[styles.closeButtonText, { color: detailsBtnText }]}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Transactions list */}
      <View style={{ flex: 1, marginTop: 12 }}>
        <NairaCardTransactions />
      </View>
      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        icon={alertState.icon}
        iconColor={alertState.iconColor}
        onRequestClose={hideAlert}
      />

      {/* Transaction PIN Setup Modal */}
      <TransactionPinSetupModal
        visible={showPinSetup}
        onSuccess={() => {
          if (userData) {
            setUserData({ ...userData, hasTransactionPin: true });
          }
        }}
        onClose={() => setShowPinSetup(false)}
      />

      {/* PIN Verify Modal */}
      <TransactionPinModal
        visible={showPinVerify}
        isProcessing={pinProcessing}
        onClose={() => {
          if (!pinProcessing) {
            setShowPinVerify(false);
            setPendingAction(null);
          }
        }}
        onPinEntered={async (pin) => {
          setPinProcessing(true);
          try {
            const toRun = pendingAction;
            setPendingAction(null);
            setShowPinVerify(false);
            await toRun?.(pin);
          } finally {
            setPinProcessing(false);
          }
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    width:'100%'
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
  button: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  buttonText: {
    color: '#333',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  createButton: {
    marginTop: 8,
    width: '80%',
  },
  primaryButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: '#0b5cff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: '#fff',
    fontWeight: '700',
  },
  freezeBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardMiddle: {
    marginTop: 24,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '600',
  },
  cardBottom: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallLabel: {
    color: '#e6f0ff',
    fontSize: 11,
  },
  value: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  infoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  cardActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  detailsButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#0b5cff',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#0a84ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
