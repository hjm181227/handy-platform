import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
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
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // initialPosition이 변경될 때 위치 업데이트
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      // 새로운 위치 계산 (현재 위치 + 드래그 거리)
      const newPosition = currentPosition + gestureState.dx;
      const boundedPosition = Math.max(0, Math.min(containerWidth, newPosition));
      
      // 실시간 위치 업데이트
      setCurrentPosition(boundedPosition);
      onPositionChange(boundedPosition);
    },
    onPanResponderRelease: () => {
      // 드래그 종료 시 아무것도 하지 않음 (이미 실시간으로 업데이트됨)
    },
  });

  return (
    <View
      style={[
        styles.container,
        {
          left: currentPosition, // 직접 위치 설정
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.line, { backgroundColor: lineColor }]} />
      <View style={[styles.handle, { backgroundColor: lineColor }]}>
        <Text style={styles.handleText}>{label}</Text>
      </View>
      {/* 터치 영역 확장용 투명 영역 */}
      <View style={styles.touchArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
    height: '100%',
    zIndex: 100,
    elevation: 100,
  },
  line: {
    width: 4,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 50,
  },
  handle: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 50,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  handleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: -30,
    right: -30,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default DraggableReferenceLine;