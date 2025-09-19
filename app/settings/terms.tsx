import React, { useMemo } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { TERMS_HTML } from '@/constants/terms';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
  const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
  const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
  const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';

  const contentWidth = Dimensions.get('window').width - 32; // 16px horizontal padding each side

  const tagsStyles = useMemo(() => ({
    body: { color: textColor, backgroundColor: 'transparent' },
    p: { color: secondaryTextColor, lineHeight: 22 },
    h1: { color: textColor },
    h2: { color: textColor },
    h3: { color: textColor },
    a: { color: Palette.primary },
    li: { color: secondaryTextColor, lineHeight: 22 },
  }), [textColor, secondaryTextColor]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}> 
      <View style={[styles.header, { borderBottomColor: borderColor }]}> 
        <TouchableOpacity onPress={() => { try { require('expo-router').router.back(); } catch(e){} }} style={styles.backButton}> 
          <IconSymbol name="chevron.left" size={24} color={textColor} /> 
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Terms & Conditions</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { borderColor, backgroundColor: colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa' }]}> 
          <RenderHTML
            contentWidth={contentWidth}
            source={{ html: TERMS_HTML }}
            tagsStyles={tagsStyles}
            renderersProps={{
              a: {
                onPress: (_evt: any, href?: string) => {
                  if (href) Linking.openURL(href);
                },
              },
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: { width: 32 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
