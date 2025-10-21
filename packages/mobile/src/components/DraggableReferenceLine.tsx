import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';

interface DraggableReferenceLineProps {
  initialPosition: number;
  lineColor: string;
  label: string;
  onPositionChange: (position: number) => void;
  containerWidth: number;
  isVertical?: boolean;
}

const DraggableReferenceLine: React.FC<DraggableReferenceLineProps> = ({
  initialPosition,
  lineColor,
  label,
  onPositionChange,
  containerWidth,
  isVertical = true,
}) => {
  const pan = useRef(new Animated.Value(initialPosition)).current;
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(currentPosition);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newPosition = gestureState.dx;
        const boundedPosition = Math.max(0, Math.min(containerWidth, currentPosition + newPosition));
        pan.setValue(boundedPosition - currentPosition);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const newPosition = Math.max(0, Math.min(containerWidth, currentPosition + gestureState.dx));
        pan.flattenOffset();
        setCurrentPosition(newPosition);
        onPositionChange(newPosition);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.line, { backgroundColor: lineColor }]} />
      <View style={[styles.handle, { backgroundColor: lineColor }]}>
        <Text style={styles.handleText}>{label}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    width: 20,
    height: '100%',
    zIndex: 10,
  },
  line: {
    width: 2,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  handle: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  handleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DraggableReferenceLine;