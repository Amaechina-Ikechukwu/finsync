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
import { CameraType } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function KycNinScreen() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [frontUri, setFrontUri] = useState<string>('');
  const [backUri, setBackUri] = useState<string>('');
  const [nin, setNin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'front' | 'back' | 'review'>('front');
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
        if (step === 'front') {
          setFrontUri(photo.uri);
          setStep('back');
          showNotification('Front captured. Now capture the back.', 'info');
        } else if (step === 'back') {
          setBackUri(photo.uri);
          setStep('review');
        }
      }
    } catch (e: any) {
      showNotification(e?.message || 'Failed to capture photo', 'error');
    }
  };

  const submit = async () => {
    if (!frontUri || !backUri)
      return showNotification('Please select both front and back images', 'error');
    if (!/^\d{11}$/.test(nin))
      return showNotification('Enter a valid 11-digit NIN', 'error');
    setLoading(true);
    try {
      const [frontUrl, backUrl] = await Promise.all([
        uploadImageToStorage(frontUri, `ids/nin/${auth.currentUser?.uid}/${Date.now()}-front.jpg`),
        uploadImageToStorage(backUri, `ids/nin/${auth.currentUser?.uid}/${Date.now()}-back.jpg`),
      ]);
      const res = await accountService.submitIdentity({ ninFront: frontUrl, ninBack: backUrl, nin });
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
    <SafeAreaView style={{flex:1}}>
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
          style={[styles.input, { color: text, borderColor: border }]}
        />

        {/* Camera capture flow */}
        {step !== 'review' ? (
          <View>
            <ThemedText style={[styles.label, { color: text }]}>
              {step === 'front' ? 'Capture Front of NIN Card' : 'Capture Back of NIN Card'}
            </ThemedText>
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
            <View style={styles.row}>
              <AppButton
                title={flash === 'on' ? 'Flash On' : flash === 'auto' ? 'Flash Auto' : 'Flash Off'}
                onPress={() => setFlash(flash === 'off' ? 'auto' : flash === 'auto' ? 'on' : 'off')}
                style={{ marginRight: 8 }}
              />
              <AppButton title="Capture" onPress={capture} />
            </View>
          </View>
        ) : (
          <View>
            <ThemedText style={[styles.label, { color: text }]}>Review</ThemedText>
            <View style={styles.previewRow}>
              <View style={[styles.pick, { borderColor: border, width: '48%' }]}>
                {frontUri ? <Image source={{ uri: frontUri }} style={styles.preview} /> : <ThemedText>Front missing</ThemedText>}
              </View>
              <View style={[styles.pick, { borderColor: border, width: '48%' }]}>
                {backUri ? <Image source={{ uri: backUri }} style={styles.preview} /> : <ThemedText>Back missing</ThemedText>}
              </View>
            </View>
            <View style={styles.row}>
              <AppButton title="Retake Front" onPress={() => { setFrontUri(''); setStep('front'); }} style={{ marginRight: 8 }} />
              <AppButton title="Retake Back" onPress={() => { setBackUri(''); setStep('back'); }} />
            </View>
            <AppButton title={loading ? 'Submitting…' : 'Submit'} onPress={submit} loading={loading} />
          </View>
        )}
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
});
