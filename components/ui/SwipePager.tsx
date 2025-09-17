import React, { useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, View } from 'react-native';

interface SwipePagerProps {
  children: React.ReactNode[];
  activeIndex: number;
  onIndexChange: (idx: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const SwipePager: React.FC<SwipePagerProps> = ({ children, activeIndex, onIndexChange }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [internalIndex, setInternalIndex] = useState(activeIndex);
  const childrenCount = React.Children.count(children);

  React.useEffect(() => {
    setInternalIndex(activeIndex);
    Animated.spring(pan, {
      toValue: { x: -activeIndex * SCREEN_WIDTH, y: 0 },
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        let newIndex = internalIndex;
        if (gesture.dx < -50 && internalIndex < childrenCount - 1) {
          newIndex = internalIndex + 1;
        } else if (gesture.dx > 50 && internalIndex > 0) {
          newIndex = internalIndex - 1;
        }
        onIndexChange(newIndex);
        Animated.spring(pan, {
          toValue: { x: -newIndex * SCREEN_WIDTH, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        width: SCREEN_WIDTH * childrenCount,
        transform: [{ translateX: pan.x }],
      }}
      {...panResponder.panHandlers}
    >
      {React.Children.map(children, (child, idx) => (
        <View style={{ width: SCREEN_WIDTH }} key={idx}>
          {child}
        </View>
      ))}
    </Animated.View>
  );
};

export default SwipePager;
