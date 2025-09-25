import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
// If you have an icon lib, replace with Ionicons/Feather/Lucide
import { Text } from 'react-native';

export interface CryptoEstimate {
  coin?: { name?: string; symbol?: string };
  crypto_amount?: string | number;
  current_rate?: number;
  gross_amount?: number;
  service_charge?: number;
  net_amount?: number;
  our_wallet_address?: string;
  note?: string;
}

export default function CryptoEstimateModal({
  estimate,
  visible,
  onClose,
  onCopy,
  onConfirm,
}: {
  estimate: CryptoEstimate | null;
  visible: boolean;
  onClose: () => void;
  onCopy?: (address?: string) => void;
  onConfirm?: () => void;
}) {
  const themeText = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');

  if (!estimate) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.card, { backgroundColor: bg }]}>
          {/* Close Icon */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: themeText }}>✕</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ paddingBottom: 12 }} style={{ maxHeight: '100%' }}>
            <ThemedText type="title" style={[styles.title, { color: themeText }]}>
              💰 Estimate
            </ThemedText>
 {estimate.note ? (
              <View>
              <ThemedText style={styles.note}>Please copy the address below and send the expected amount. Once confirmed, you will be credited.</ThemedText>
              </View>
             
            ) : null}
            <View style={styles.section}>
              <InfoRow label="Coin" value={estimate.coin?.name ?? ''} />
              <InfoRow label="Crypto amount" value={String(estimate.crypto_amount ?? '')} />
              <InfoRow label="Rate" value={`₦${Number(estimate.current_rate || 0).toLocaleString()}`} />
              <InfoRow label="Gross" value={`₦${Number(estimate.gross_amount || 0).toLocaleString()}`} />
              <InfoRow label="Service fee" value={`₦${Number(estimate.service_charge || 0).toLocaleString()}`} />
            </View>

            <View style={styles.highlightBox}>
              <ThemedText style={styles.highlightLabel}>You will receive</ThemedText>
              <ThemedText style={styles.highlightValue}>
                ₦{Number(estimate.net_amount || 0).toLocaleString()}
              </ThemedText>
            </View>

            <View style={styles.walletContainer}>
              <TextInput
                value={estimate.our_wallet_address}
                editable={false}
                style={[styles.walletInput, { color: themeText }]}
                selectTextOnFocus={true}
              />
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => onCopy && onCopy(estimate.our_wallet_address)}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#2d7a2d' }}>Copy</Text>
              </TouchableOpacity>
            </View>

            {estimate.note ? (
              <View>
                 <ThemedText style={styles.note}>{estimate.note}</ThemedText>
           
              </View>
             
            ) : null}
          </ScrollView>

          {/* Footer: Confirm button */}
          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                if (onConfirm) return onConfirm();
                return onClose();
              }}
              style={[styles.confirmButton, { backgroundColor: '#2d7a2d' }]}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <ThemedText style={styles.value}>{value}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    maxWidth: 560,
  width: '100%',
  maxHeight: '60%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  closeIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 6,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    paddingBottom: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 15, fontWeight: '500' },
  highlightBox: {
    backgroundColor: '#eafbea',
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
    alignItems: 'center',
  },
  highlightLabel: { fontSize: 14, color: '#2d7a2d', marginBottom: 4 },
  highlightValue: { fontSize: 18, fontWeight: '700', color: '#2d7a2d' },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 30,
    overflow: 'hidden',
  },
  walletInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  copyButton: {
    backgroundColor: '#eafbea',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  note: { marginTop: 12, color: '#666', fontSize: 13, lineHeight: 18 },
  footer: {
    marginTop: 12,
    marginHorizontal: -20,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e6e6',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    width:"100%",
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
