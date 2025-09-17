import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const OPTIONS = [
  { key: 'buy', label: 'Buy Cards', route: '/giftcards' as const, icon: 'shopping-cart' },
  { key: 'sell', label: 'Sell Cards', route: '/giftcards/sellcards' as const, icon: 'sell' },
  { key: 'purchased', label: 'See Purchased Cards', route: '/giftcards/cardlist' as const, icon: 'credit-card' },
  { key: 'uploaded', label: 'See Uploaded Cards', route: '/giftcards/uploaded cards' as const, icon: 'cloud-upload' },
];

export default function GiftCardOptionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#2D2D2D' : Palette.white;
  const iconColor = isDark ? Palette.white : Palette.black;
  const borderColor = isDark ? Palette.white : Palette.black;
  const textColor = isDark ? Palette.white : Palette.black;
  const router = useRouter();
  const navigation= useNavigation()
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Gift Cards',
      headerShown: true,
    });
  }, [navigation]);
  const OptionCard = ({ option }: { option: typeof OPTIONS[0] }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
        },
      ]}
      onPress={() => router.push(option.route)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
        ]}>
          <MaterialIcons
            name={option.icon as any}
            size={28}
            color={iconColor}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.optionTitle, { color: textColor }]}> 
            {option.label}
          </ThemedText>
        </View>
        <View style={styles.chevronContainer}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={iconColor + '80'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.optionsList}>
        {OPTIONS.map(option => (
          <OptionCard key={option.key} option={option} />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  optionsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  chevronContainer: {
    padding: 4,
  },
});