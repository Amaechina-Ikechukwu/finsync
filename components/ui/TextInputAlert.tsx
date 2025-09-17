import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: screenWidth } = Dimensions.get('window');

interface TextInputAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  onRequestClose?: () => void;
}

export default function TextInputAlert({
  visible,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
  onRequestClose
}: TextInputAlertProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [inputValue, setInputValue] = useState(defaultValue);

  // Update input value when defaultValue changes
  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const overlayBg = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      setInputValue('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setInputValue('');
  };

  const handleClose = () => {
    if (onRequestClose) {
      onRequestClose();
    } else {
      handleCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={[styles.alertContainer, { backgroundColor: cardBg }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[
              styles.iconCircle, 
              { backgroundColor: `${Palette.info}20` }
            ]}>
              <IconSymbol 
                name="person.circle" 
                size={32} 
                color={Palette.info} 
              />
            </View>
          </View>

          {/* Title */}
          <ThemedText style={styles.title}>{title}</ThemedText>

          {/* Message */}
          {message && (
            <ThemedText style={styles.message}>{message}</ThemedText>
          )}

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <ThemedTextInput
              style={styles.textInput}
              placeholder={placeholder}
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          </View>          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <AppButton
                title="Cancel"
                onPress={handleCancel}
                variant={isDark ? 'dark' : 'white'}
                style={styles.button}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <AppButton
                title="Save"
                onPress={handleConfirm}
                variant={isDark ? 'white' : 'dark'}
                // style={styles.button}
                disabled={!inputValue.trim()}
              />
            </View>
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
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  textInput: {
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    flex: 1,
  },
});
