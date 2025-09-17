// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.down': 'expand-more',
  'dollar': 'attach-money',
  'clipboard': 'assignment',
  'user': 'person-outline',
  'notifications': 'notifications-none',
  'bell': 'notifications',
  // Settings icons and close variants
  'person.circle.fill': 'account-circle',
  'lock.fill': 'lock',
  'checkmark.shield.fill': 'verified-user',
  'faceid': 'face',
  'questionmark.circle.fill': 'help',
  'message.fill': 'message',
  'star.fill': 'star',
  'hand.raised.fill': 'pan-tool',
  'text.book.closed.fill': 'menu-book',
  'arrow.right.square.fill': 'logout',
  'trash.fill': 'delete',
  // Commented preferences (future use)
  'bell.fill': 'notifications',
  'creditcard.fill': 'credit-card',
  'envelope.fill': 'email',
  'globe': 'public',
  'dollarsign.circle.fill': 'attach-money',
  'moon.fill': 'nights-stay',
  'person': 'person-outline',
  'person.circle': 'account-circle',
  'person.slash': 'block',
  'add': 'add',
  'send': 'send',
  'lock': 'lock',
  'flight': 'flight',
  'receipt': 'receipt',
  'trending-up': 'trending-up',
  "donut-small":"donut-small",
  'phone': 'phone',
  'wifi': 'wifi',
  'flash': 'flash-on',
  'sports': 'sports-esports',
  'tv': 'tv',
  'security': 'security',
  'exclamationmark.triangle': 'warning',
  // Missing icons from the app
  'plus.circle.fill': 'add-circle',
  'xmark.circle.fill': 'cancel',
  'xmark': 'close',
  'magnifyingglass': 'search',
  'doc.on.doc': 'content-copy',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'info.circle': 'info',
  'arrow.up.circle.fill': 'north',
  'arrow.down.circle.fill': 'south',
  'doc.text.fill': 'description',
  'ellipsis.circle.fill': 'more-horiz',
  // Transaction icons from store
  'cup.and.saucer.fill': 'local-cafe',
  'banknote.fill': 'attach-money',
  'tv.fill': 'tv',
  'fuelpump.fill': 'local-gas-station',
  'laptopcomputer': 'computer',
  'schedule': 'schedule',
  // Banking and transfer icons
  'building.2.fill': 'account-balance',
  'building.2': 'account-balance',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  "credit-card":"credit-card",
  "gift":'card-giftcard',
  "bitcoin":"currency-bitcoin" ,
  "add-reaction":'add-reaction',
  "qr.code":"qr.code",
  "network":"network"

} as const;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
