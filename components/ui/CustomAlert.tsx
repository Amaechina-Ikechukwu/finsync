import React from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton, { ButtonVariant } from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: screenWidth } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onRequestClose?: () => void;
  icon?: 'add' | 'xmark.circle.fill' | 'security' | 'person.circle' | 'receipt';
  iconColor?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onRequestClose,
  icon,
  iconColor
}: CustomAlertProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const overlayBg = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onRequestClose) {
      onRequestClose();
    }
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onRequestClose}
        />
        
        <View style={[styles.alertContainer, { backgroundColor: cardBg }]}>
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconCircle, 
                { backgroundColor: iconColor ? `${iconColor}20` : `${Palette.info}20` }
              ]}>
                <IconSymbol 
                  name={icon} 
                  size={32} 
                  color={iconColor || Palette.info} 
                />
              </View>
            </View>
          )}

          {/* Title */}
          <ThemedText style={styles.title}>{title}</ThemedText>

          {/* Message */}
          {message && (
            <ThemedText style={styles.message}>{message}</ThemedText>
          )}          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const buttonStyle = [
                styles.button,
                ...(buttons.length === 1 ? [styles.singleButton] : [])
              ];              // Determine button variant based on style
              let variant: ButtonVariant;
              if (button.style === 'destructive') {
                variant = 'coral';
              } else if (button.style === 'cancel') {
                variant = isDark ? 'dark' : 'white';
              } else {
                // For 'default' style, use contrasting colors
                variant = isDark ? 'white' : 'dark';
              }
              
              return (
                <View key={index} style={styles.buttonWrapper}>
                  <AppButton
                    title={button.text}
                    onPress={() => handleButtonPress(button)}
                    variant={variant}
                    style={StyleSheet.flatten(buttonStyle)}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: '100%',
    maxWidth: screenWidth - 80,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
  singleButton: {
    marginTop: 8,
  },
});
