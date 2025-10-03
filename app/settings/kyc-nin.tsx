import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { auth } from '@/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { accountService } from '@/services/apiService';
import { uploadImageToStorage } from '@/utils/upload';
import { CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { CameraType } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function KycNinScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [frontUri, setFrontUri] = useState<string>('');
  const [nin, setNin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('auto');

  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? Palette.black : Palette.white;
  const text = scheme === 'dark' ? Palette.white : Palette.text;
  const card = scheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
  const border = scheme === 'dark' ? Palette.grayDark : '#e5e7eb';

  useEffect(() => {
    if (permission?.granted) {
      setHasPermission(true);
    } else {
      (async () => {
        const { granted } = await requestPermission();
        setHasPermission(granted);
      })();
    }
  }, [permission]);

  const capture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setFrontUri(photo.uri);
        setReview(true);
      }
    } catch (e: any) {
      showNotification(e?.message || 'Failed to capture photo', 'error');
    }
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return showNotification('Gallery permission denied', 'error');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!res.canceled && res.assets?.length) {
        setFrontUri(res.assets[0].uri);
        setReview(true);
      }
    } catch (e: any) {
      showNotification(e?.message || 'Failed to pick image', 'error');
    }
  };

  const submit = async () => {
    if (!frontUri)
      return showNotification('Please capture or select the front image', 'error');
    if (!/^\d{11}$/.test(nin))
      return showNotification('Enter a valid 11-digit NIN', 'error');
    setLoading(true);
    try {
      const frontUrl = await uploadImageToStorage(frontUri, `ids/nin/${auth.currentUser?.uid}/${Date.now()}-front.jpg`);
      const res = await accountService.submitIdentity({ ninFront: frontUrl, nin });
      console.log({res})
      if (res.success) {
        showNotification(res.message || 'Details submitted successfully', 'success');
        router.back();
      } else {
        showNotification(res.message || 'Submission failed', 'error');
      }
    } catch (e: any) {
      showNotification(e?.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === false) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ThemedText>Camera permission not granted.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
          <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: text }]}>KYC: NIN</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
        <ThemedText style={[styles.label, { color: text }]}>NIN Number</ThemedText>
        <ThemedTextInput
          placeholder="Enter 11-digit NIN"
          value={nin}
          onChangeText={(t) => setNin(t.replace(/[^0-9]/g, '').slice(0, 11))}
          keyboardType="numeric"
          returnKeyType="done"
          
          onSubmitEditing={() => Keyboard.dismiss()}
          style={[styles.input, { color: text, borderColor: border }]}
        />

        {!review ? (
          <View>
            <ThemedText style={[styles.label, { color: text }]}>Capture Front of NIN Card</ThemedText>
            <View style={styles.cameraContainer}>
              {hasPermission ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={CameraType.back}
                  flash={flash}
                  enableTorch={flash === 'on'}
                  ratio="4:3"
                />
              ) : (
                <ThemedText>Requesting camera permission…</ThemedText>
              )}
              <View pointerEvents="none" style={styles.overlayWrapper}>
                <View style={styles.overlay} />
              </View>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() => setFlash(flash === 'off' ? 'auto' : flash === 'auto' ? 'on' : 'off')}
                style={styles.iconButton}
                accessibilityLabel="Toggle flash mode"
              >
                <IconSymbol
                  name={flash === 'on' ? 'flash' : 'flash'}
                  size={24}
                  color={text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={capture}
                style={[styles.iconButton, styles.captureButton]}
                accessibilityLabel="Capture photo"
              >
                <IconSymbol name="camera" size={28} color={bg} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickFromGallery}
                style={styles.iconButton}
                accessibilityLabel="Pick from gallery"
              >
                <IconSymbol name="image" size={24} color={text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <ThemedText style={[styles.label, { color: text }]}>Review</ThemedText>
            <View style={styles.previewRow}>
              <View style={[styles.pick, { borderColor: border, width: '100%' }]}>
                {frontUri ? <Image source={{ uri: frontUri }} style={styles.preview} /> : <ThemedText>No image</ThemedText>}
              </View>
            </View>
            <View style={[styles.row, { flexDirection: 'column' }]}>
              <AppButton title="Retake" onPress={() => { setFrontUri(''); setReview(false); }} style={{ marginRight: 8 }} />
              <AppButton title={loading ? 'Submitting…' : 'Submit'} onPress={submit} loading={loading} />
            </View>
          </View>
        )}
      </View>
          </ThemedView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Belgrano-Regular', flex: 1, textAlign: 'center', marginRight: 32 },
  headerSpacer: { width: 32 },
  card: { margin: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  label: { fontFamily: 'Belgrano-Regular', marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  pick: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center', height: 150, marginBottom: 12 },
  preview: { width: '100%', height: '100%', borderRadius: 8 },
  cameraContainer: { position: 'relative', width: '100%', height: 300, overflow: 'hidden', borderRadius: 12, marginBottom: 12 },
  camera: { width: '100%', height: '100%' },
  overlayWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overlay: { width: '80%', height: '60%', borderWidth: 2, borderStyle: 'dashed', borderColor: '#ffffffaa', borderRadius: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  row: { flexDirection: 'column', alignItems: 'center', marginTop: 8, justifyContent: 'center' },
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 4 },
  iconButton: { width: 54, height: 54, borderRadius: 54, borderWidth: 1, borderColor: '#8884', alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, backgroundColor: 'transparent' },
  captureButton: { backgroundColor: '#FF6F6F', borderColor: '#FF6F6F' },
});
