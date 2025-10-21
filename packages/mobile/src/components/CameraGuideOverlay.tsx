import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraGuideOverlayProps {
  visible: boolean;
}

const CameraGuideOverlay: React.FC<CameraGuideOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  // 신용카드 표준 규격 (ISO/IEC 7810 ID-1)
  // 크기: 85.60mm × 53.98mm, 비율: 1.586:1
  const CARD_ASPECT_RATIO = 85.60 / 53.98; // 약 1.586

  // 화면 크기에 맞는 가이드 영역 계산
  const guideAreaWidth = screenWidth * 0.8; // 화면 폭의 80%
  const cardGuideWidth = guideAreaWidth * 0.6; // 가이드 영역의 60%
  const cardGuideHeight = cardGuideWidth / CARD_ASPECT_RATIO;
  
  // 전체 촬영 영역 (카드 + 손가락 공간)
  const totalGuideWidth = guideAreaWidth;
  const totalGuideHeight = Math.max(cardGuideHeight * 1.8, screenHeight * 0.4);

  // 가이드 영역 중앙 위치 계산
  const guideLeft = (screenWidth - totalGuideWidth) / 2;
  const guideTop = (screenHeight - totalGuideHeight) / 2;

  // 카드 가이드 중앙 위치 계산
  const cardLeft = (screenWidth - cardGuideWidth) / 2;
  const cardTop = guideTop + (totalGuideHeight - cardGuideHeight) / 2 - 20; // 약간 위로

  return (
    <View style={styles.overlay}>
      {/* 어둡게 처리된 배경 */}
      <View style={styles.darkBackground} />

      {/* 카드 가이드 */}
      <View
        style={[
          styles.cardGuide,
          {
            left: cardLeft,
            top: cardTop,
            width: cardGuideWidth,
            height: cardGuideHeight,
          },
        ]}
      />

      {/* 상단 안내 텍스트 */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>📷 촬영 가이드</Text>
        <Text style={styles.instructionText}>
          신용카드를 황금색 영역에 위치시키고, 손가락을 카드 옆에 함께 촬영하세요
        </Text>
      </View>

      {/* 하단 팁 */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 카드와 손가락이 모두 잘 보이게 촬영해주세요
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  darkBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cardGuide: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  instructionContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
  },
  instructionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 12,
  },
  tipText: {
    color: '#FFF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default CameraGuideOverlay;