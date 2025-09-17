import { useNotification } from '@/components/InAppNotificationProvider';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface UpdateCardFormProps {
  card: any;
  onSuccess?: () => void;
}

const UpdateCardForm: React.FC<UpdateCardFormProps> = ({ card, onSuccess }) => {
  const [name, setName] = useState(card.name || '');
  const [type, setType] = useState(card.type || '');
  const [value, setValue] = useState(card.value?.toString() || '');
  const [price, setPrice] = useState(card.price?.toString() || '');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const { showNotification } = useNotification();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#181A20' : '#ffffff';
  const cardColor = isDark ? '#23262F' : '#F9FAFB';
  const borderColor = isDark ? '#2D3038' : '#E5E7EB';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const labelColor = isDark ? '#A1A5B2' : '#374151';
  const placeholderColor = isDark ? '#6B7280' : '#9CA3AF';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: any = {};
      if (name !== card.name) body.name = name;
      if (type !== card.type) body.type = type;
      if (value !== card.value?.toString()) body.value = value;
      if (price !== card.price?.toString()) body.price = price;
      if (Object.keys(body).length === 0) {
        showNotification('No changes to update', 'info');
        setLoading(false);
        return;
      }
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/giftcards/available/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Card updated', 'success');
        onSuccess?.();
      } else {
        showNotification(data.message || 'Failed to update card', 'error');
      }
    } catch (err) {
      showNotification('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.label, { color: labelColor }]}>Card Name</Text>
      <ThemedTextInput
        placeholder="e.g., Amazon Gift Card"
        placeholderTextColor={placeholderColor}
        value={name}
        onChangeText={setName}
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />
      <Text style={[styles.label, { color: labelColor }]}>Type</Text>
      <ThemedTextInput
        placeholder="e.g., Shopping"
        placeholderTextColor={placeholderColor}
        value={type}
        onChangeText={setType}
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />
      <Text style={[styles.label, { color: labelColor }]}>Card Value</Text>
      <ThemedTextInput
        placeholder="1000"
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />
      <Text style={[styles.label, { color: labelColor }]}>Selling Price</Text>
      <ThemedTextInput
        placeholder="Enter your price"
        placeholderTextColor={placeholderColor}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />
      <AppButton
        title={loading ? 'Updating...' : 'Update Card'}
        onPress={handleSubmit}
        disabled={loading}
        variant={isDark ? 'white' : 'dark'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    margin: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

export default UpdateCardForm;
