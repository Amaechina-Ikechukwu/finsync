import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';

export type InAppNotificationType = 'success' | 'error' | 'info';

const COLORS = {
  success: '#00C853', // Green
  error: '#FF5252',   // Red
  info: '#424242',    // Dark Gray
};

const TEXT_COLORS = {
  success: '#fff',
  error: '#fff',
  info: '#fff',
};

const TAB_GRADIENTS = {
  success: ['#00C853', '#00BFA5'], // Green gradient
  error: ['#FF5252', '#FF1744'],   // Red gradient
  info: ['#424242', '#212121'],    // Dark Gray gradient
};

const NOTIF_WIDTH = Dimensions.get('window').width * 0.7;

export interface InAppNotificationProps {
  message: string;
  type?: InAppNotificationType;
  visible: boolean;
  onHide?: () => void;
  disableAutoHide?: boolean; // Allow external control of auto-hide behavior
}

export function InAppNotification({ message, type = 'info', visible, onHide, disableAutoHide = false }: InAppNotificationProps) {
  const translateY = useRef(new Animated.Value(-150)).current; // Start completely off-screen

  useEffect(() => {
    // Don't animate if there's no message
    if (!message || message.trim() === '') {
      return;
    }

    if (visible) {
      // Slide in from top
      Animated.spring(translateY, {
        toValue: Platform.OS === 'web' ? 20 : 50,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      // Auto-hide after 3 seconds (only if not disabled)
      if (!disableAutoHide) {
        const timeout = setTimeout(() => {
          // Slide out to top (completely off-screen)
          Animated.timing(translateY, {
            toValue: -150,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            if (onHide) {
              onHide();
            }
          });
        }, 3000);
        
        return () => clearTimeout(timeout);
      }
    } else {
      // Immediate hide - slide out to top
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Ensure onHide is called even on manual hide to clear message
        if (onHide) {
          onHide();
        }
      });
    }
  }, [visible, message, onHide, translateY, disableAutoHide]);

  // Don't render if there's no message
  if (!message || message.trim() === '') {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <LinearGradient
        colors={TAB_GRADIENTS[type] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 40 }]}
      />
      <View style={{ backgroundColor: "transparent", padding: 10 }}>
        <Text style={[styles.text, { color: TEXT_COLORS[type], zIndex: 1 }]}> 
          {message || ''}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: '15%', // center by offsetting left by 15%
    width: NOTIF_WIDTH,
    marginTop: Platform.OS === 'web' ? 20 : 5,
    borderRadius: 40, // more pronounced pill shape
    minHeight: 40,    // reduced height
    paddingVertical: 0, // less vertical padding
    paddingHorizontal: 0, // no extra horizontal padding
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    shadowColor: '#404040',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  text: {
    fontFamily: 'Belgrano',
    fontSize: 18, // keep large readable font
    fontWeight: '400',
    paddingVertical: 8,
    paddingHorizontal: 0, // remove extra horizontal padding
    textAlign:"center"
  },
});
