import FrostyOnboardingBG from '@/components/FrostyOnboardingBG';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const logo = require('@/assets/images/icon-dark.png'); // Use your dark logo

const slides = [
  {
    title: 'Money, movement meaning',
    description: '',
  },
  {
    title: 'One app, everything handled',
    description: '',
  },
  {
    title: 'The essentialtity',
    description: '',
  },
];

export default function Onboarding({ onFinish }: { onFinish?: () => void }) {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const bgColor = useThemeColor({}, 'background');
  const translateX = useSharedValue(0);
  
  const handleNext = () => {
    if (!isLast) {
      setIndex((prevIndex) => prevIndex + 1);
      translateX.value = withTiming(-400, { duration: 300 });
      setTimeout(() => {
        translateX.value = 0;
      }, 300);
    }
  };
  const handleBack = () => {
    if (index > 0) {
      setIndex((prevIndex) => prevIndex - 1);
      translateX.value = withTiming(400, { duration: 300 });
      setTimeout(() => {
        translateX.value = 0;
      }, 300);
    }
  };
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleFinish = async () => {
    if (onFinish) onFinish();
  };
  return (
    <FrostyOnboardingBG>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.centerContainer}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.textContainer}>
        <PanGestureHandler enabled={false}>
          <Animated.View style={animatedStyle}>
            <Text style={styles.title}>{slides[index].title}</Text>
            {slides[index].description ? (
              <Text style={styles.description}>{slides[index].description}</Text>
            ) : null}
            <View style={styles.buttonRow}>
              {index > 0 && (
                <TouchableOpacity style={styles.button} onPress={handleBack}>
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
              )}
              {!isLast && (
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              )}
              {isLast && (
                <TouchableOpacity style={styles.buttonWhite} onPress={handleFinish}>
                  <Text style={styles.buttonTextPrimaryDark}>Get Started</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </FrostyOnboardingBG>
  );
}

const styles = StyleSheet.create({
  skipContainer: {
    position: 'absolute',
    top: 48,
    right: 32,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    position: 'absolute',
    top: '32%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    width: '100%',
    padding: 32,
    paddingBottom: 80,
  },
  title: {
    color: '#fff',
    fontSize: 54,
    fontWeight: 'bold',
    fontFamily: 'Belgrano-Regular',
    lineHeight: 62,
    marginBottom: 12,
  },
  description: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 32,
    fontFamily: 'Belgrano-Regular',
    opacity: 0.9,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonWhite: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  buttonTextPrimaryDark: {
    color: '#0a7ea4',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
