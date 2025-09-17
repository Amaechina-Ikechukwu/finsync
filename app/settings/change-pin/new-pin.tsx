import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { userService } from '@/services/apiService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function ChangePinNewPinScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const onChangeOld = (t: string) => setOldPin(t.replace(/[^0-9]/g, '').slice(0, 4));
  const onChangeNew = (t: string) => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 4));
  const onChangeConfirm = (t: string) => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4));

  const handleSubmit = async () => {
    if (newPin.length !== 4) return showNotification('New PIN must be 4 digits', 'error');
    if (newPin !== confirmPin) return showNotification('PINs do not match', 'error');
    if (oldPin.length !== 4) return showNotification('Enter your current PIN', 'error');

    setLoading(true);
    try {
      const res = await userService.changeTransactionPin({ oldPin, newPin });
      if (res.success) {
        showNotification(res.message || 'Transaction PIN changed successfully', 'success');
        router.replace('/settings');
      } else {
        showNotification(res.message || 'Failed to change PIN', 'error');
      }
    } catch (e: any) {
      showNotification(e?.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Set New PIN</ThemedText>
        <ThemedText style={styles.subtitle}>Enter your current PIN and choose a new 4‑digit PIN.</ThemedText>
        <ThemedTextInput
          placeholder="Current PIN"
          value={oldPin}
          onChangeText={onChangeOld}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          style={styles.input}
        />
        <ThemedTextInput
          placeholder="New PIN"
          value={newPin}
          onChangeText={onChangeNew}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          style={styles.input}
        />
        <ThemedTextInput
          placeholder="Confirm New PIN"
          value={confirmPin}
          onChangeText={onChangeConfirm}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          style={styles.input}
        />
        <AppButton title={loading ? 'Changing…' : 'Change PIN'} onPress={handleSubmit} loading={loading} disabled={loading} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 420 },
  title: { textAlign: 'center', marginBottom: 8, fontFamily: 'Belgrano-Regular' },
  subtitle: { textAlign: 'center', marginBottom: 16, opacity: 0.9, fontFamily: 'Belgrano-Regular' },
  input: { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
});
