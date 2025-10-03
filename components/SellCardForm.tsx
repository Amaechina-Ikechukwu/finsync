import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProductCategory } from '@/services/apiService';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useNotification } from './InAppNotificationProvider';
import CrossPlatformPicker from './ui/CrossPlatformPicker';

interface SellCardFormProps {
  categories: ProductCategory[];
  onSubmit: (data: SellCardFormData) => void;
  loading?: boolean;
}

export interface SellCardFormData {
  name: string;
  type: string;
  value: string;
  price: string;
  redeemCode: string;
  imageUri?: string;
}

const SellCardForm: React.FC<SellCardFormProps> = ({ categories, onSubmit, loading }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [value, setValue] = useState('');
  const [price, setPrice] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();

  const colorScheme = useColorScheme();
  const { showNotification } = useNotification();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#181A20' : '#ffffff';
  const cardColor = isDark ? '#23262F' : '#F9FAFB';
  const borderColor = isDark ? '#2D3038' : '#E5E7EB';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const labelColor = isDark ? '#A1A5B2' : '#374151';
  const placeholderColor = isDark ? '#6B7280' : '#9CA3AF';

  // Capitalize each word in name
  const formatName = (text: string) => text.replace(/\b\w/g, char => char.toUpperCase());

  // Format currency for UI
  const formatCurrency = (num: string) => {
    if (!num) return '';
    const numericValue = num.replace(/\D/g, '');
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Number(numericValue));
  };

  // Ensure type is set when categories change
  useEffect(() => {
    if (categories && categories.length > 0) {
      setType(prev => prev || categories[0].name);
    }
  }, [categories]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    showNotification('Uploading', 'info');

    const numericValue = Number(value || '0');
    const numericPrice = Number(price || '0');
    const totalPrice = numericValue + numericPrice;

    onSubmit({
      name,
      type,
      value: numericValue.toString(),
      price: totalPrice.toString(),
      redeemCode,
      imageUri,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.label, { color: labelColor }]}>Card Name</Text>
      <ThemedTextInput
        placeholder="e.g., Amazon Gift Card"
        placeholderTextColor={placeholderColor}
        value={name}
        onChangeText={(text) => setName(formatName(text))}
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />

      <Text style={[styles.label, { color: labelColor }]}>Category</Text>
      <View style={[styles.pickerWrapper, { borderColor, backgroundColor: cardColor }]}>
        <CrossPlatformPicker
          selectedValue={type}
          onValueChange={setType}
          style={[styles.picker, { color: textColor }]}
          items={categories.map(cat => ({ label: cat.name, value: cat.name }))}
          textColor={textColor}
        />
      </View>

      <Text style={[styles.label, { color: labelColor }]}>Card Value</Text>
      <ThemedTextInput
        placeholder="1000"
        placeholderTextColor={placeholderColor}
        value={formatCurrency(value)}
        onChangeText={(text) => setValue(text.replace(/\D/g, ''))}
        keyboardType="numeric"
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />

      <Text style={[styles.label, { color: labelColor }]}>Selling Price</Text>
      <ThemedTextInput
        placeholder="Enter your price"
        placeholderTextColor={placeholderColor}
        value={formatCurrency(price)}
        onChangeText={(text) => setPrice(text.replace(/\D/g, ''))}
        keyboardType="numeric"
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />

      <Text style={[styles.label, { color: labelColor }]}>Redeem Code</Text>
      <ThemedTextInput
        placeholder="Enter redeem code"
        placeholderTextColor={placeholderColor}
        value={redeemCode}
        onChangeText={setRedeemCode}
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
      />

      <Text style={[styles.label, { color: labelColor }]}>Upload Image</Text>
      <View style={[styles.imageSection, { borderColor, backgroundColor: cardColor }]}>
        {imageUri ? (
          <View style={{ width: 140, height: 100, marginBottom: 10 }}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.closeButtonContainer}>
              <Text
                style={styles.closeButton}
                onPress={() => setImageUri(undefined)}
                accessibilityLabel="Remove image"
              >
                ×
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.imagePlaceholder, { color: labelColor }]}>
            Tap below to add an image
          </Text>
        )}
        <View style={styles.imageButtons}>
          <AppButton title="📷 Camera" onPress={takePhoto} style={{ width: '30%' }} />
          <AppButton title="🖼 Gallery" onPress={pickImage} style={{ width: '30%' }} />
        </View>
      </View>

      <AppButton
        title={loading ? 'Submitting...' : 'Upload Card'}
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
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  imageSection: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  image: {
    width: 140,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 2,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default SellCardForm;
