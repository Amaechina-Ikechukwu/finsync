// Unified MaterialIcons implementation across platforms.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { ICON_MAPPING, IconSymbolName } from './iconMapping';

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
}) {
  const glyph = ICON_MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color as any} size={size} name={glyph} style={style} />;
}
