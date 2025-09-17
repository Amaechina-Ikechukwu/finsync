import { useNotification } from '@/components/InAppNotificationProvider';
import SellCardForm, { SellCardFormData } from '@/components/SellCardForm';
import { auth, storage } from '@/firebase';
import { useNavigation, useRouter } from 'expo-router';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ProductCategory, reloadlyService } from '../../services/apiService';

export default function SellCardsScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showNotification } = useNotification();
  const navigation= useNavigation()
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Sell Gift Cards',
      headerShown: true,
    });
  }, [navigation]);
  useEffect(() => {
    setLoadingCategories(true);

    reloadlyService
      .getProductCategories()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // ✅ handle form submission
const handleSubmit = async (data: SellCardFormData) => {
  try {
    if (!auth.currentUser) {
      showNotification("You must be signed in to upload cards.", "error");
      return;
    }

    setSubmitting(true);
    const uid = auth.currentUser.uid;
    let uploadedImageUrl: string | undefined;

    if (data.imageUri) {
      // ✅ Convert URI → Blob
      const response = await fetch(data.imageUri);
      const blob = await response.blob();

      // Determine file extension & MIME type
      const mimeType = blob.type || "image/jpeg";
      const ext = mimeType.split("/")[1] || "jpg";

      // ✅ Storage path per user
      const filename = `cards/${uid}/${Date.now()}-${data.name || "card"}.${ext}`;
      const imageRef = ref(storage, filename);

      // ✅ Upload blob directly
      await uploadBytes(imageRef, blob, { contentType: mimeType });

      // ✅ Get download URL
      uploadedImageUrl = await getDownloadURL(imageRef);
    }

    // ✅ Send to backend using fetch with Firebase token
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${apiUrl}/giftcards/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        value: data.value,
        price: data.price,
        code: data.redeemCode,
        image: uploadedImageUrl,
      }),
    }).then(async (r) => {
      const json = await r.json().catch(() => ({}));
      return { success: r.ok, ...json };
    });

    if (res.success) {
      showNotification("Gift card uploaded successfully!", "success");
      router.replace("/giftcards/uploaded%20cards");
    } else {
      showNotification(res.error || "Failed to upload card.", "error");
    }
  } catch (err: any) {
    console.error("Upload Error:", err);
    showNotification("Image upload failed", "error");
  } finally {
    setSubmitting(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <SellCardForm
          categories={categories}
          onSubmit={handleSubmit}
          loading={submitting || loadingCategories}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
});
