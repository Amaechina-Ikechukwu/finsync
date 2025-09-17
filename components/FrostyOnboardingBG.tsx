import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, ImageBackground, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function FrostyOnboardingBG({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/onboarding/pexels1.jpg')} // You can swap this for any onboarding image
        style={styles.image}
        resizeMode="cover"
        blurRadius={16}
      >
        <LinearGradient
          colors={["rgba(120,120,120,0.5)", "rgba(60,60,60,0.8)"]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
