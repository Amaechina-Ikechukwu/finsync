import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { referralService } from '@/services/apiService';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReferralScreen() {
  const { showNotification } = useNotification();
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const bg = colorScheme === 'dark' ? Palette.black : Palette.white;
  const text = colorScheme === 'dark' ? Palette.white : Palette.text;
  const card = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
  const border = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await referralService.getReferralCode();
      console.log({res})
      if (res.success && res?.code) {
        setCode(res.code);
      } else {
        showNotification(res.message || 'Failed to load referral code', 'error');
      }
      setLoading(false);
    })();
  }, []);

  const copyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    showNotification('Referral code copied', 'success');
  };

  const shareCode = async () => {
    const message = `Join me on FinSync! Use my referral code: ${code}`;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(undefined, { dialogTitle: 'Share referral code' });
        // Fallback: also copy to clipboard to ensure share content
        await Clipboard.setStringAsync(message);
      } else {
        await Clipboard.setStringAsync(message);
        showNotification('Copied message to clipboard', 'info');
      }
    } catch (e: any) {
      showNotification(e?.message || 'Unable to share', 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={[styles.container, { backgroundColor: bg }] }>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: text }]}>Refer & Earn</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
        <ThemedText type="title" style={[styles.title, { color: text }]}>Your Referral Code</ThemedText>
        <ThemedText style={styles.code}>{loading ? 'Loading…' : code || '— — — —'}</ThemedText>
        <View style={styles.row}>
          <AppButton title="Copy" onPress={copyCode} disabled={!code || loading} style={{ marginRight: 8,width:"40%" }} />
          {/* <AppButton title="Share" onPress={shareCode} disabled={!code || loading} style={{ width:"40%" }}/> */}
        </View>
      </View>
    </ThemedView>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Belgrano-Regular', flex: 1, textAlign: 'center', marginRight: 32 },
  headerSpacer: { width: 32 },
  card: { margin: 20, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  title: { marginBottom: 8, fontFamily: 'Belgrano-Regular' },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 6, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
