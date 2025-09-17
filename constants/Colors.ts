/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#374151', // Lighter black (gray-700)
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#D1D5DB', // Lighter white (gray-300)
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// App color palette from design
export const Palette = {
  black: '#000000',
  white: '#FFFFFF',
  grayDark: '#3F3F3F',
  gray: '#898989',
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
  info: '#0EA5E9',
  lighterBlack:"#2D2D2D",
  bolderBlack:"#1B1B1B",
  primary: '#3B82F6',
  text: '#374151',

  // Gradients can be defined as arrays in components if needed
};
