// On iOS, we unify rendering with MaterialIcons to ensure consistent glyph availability
// and avoid invisible icons due to SF Symbols name mismatches.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleProp, TextStyle } from 'react-native';
import { ICON_MAPPING, IconSymbolName } from './iconMapping';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  const glyph = ICON_MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={glyph} style={style} />;
}
