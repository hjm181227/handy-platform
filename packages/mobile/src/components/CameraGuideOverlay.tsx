import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  CARD_GUIDE_WIDTH_MOBILE,
  CARD_GUIDE_WIDTH_TABLET,
  TABLET_BREAKPOINT,
  CARD_ASPECT_RATIO,
} from '../services/nailMeasurement/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraGuideOverlayProps {
  visible: boolean;
  isThumbOnly?: boolean;
  selectedHand?: 'left' | 'right';
}

const CameraGuideOverlay: React.FC<CameraGuideOverlayProps> = ({
  visible,
  isThumbOnly = true,
  selectedHand = 'right',
}) => {
  if (!visible) return null;

  // 고정 픽셀 크기로 카드 가이드 설정
  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
  const cardGuideHeight = cardGuideWidth / CARD_ASPECT_RATIO;

  // 전체 촬영 영역 (카드 + 손가락 공간)
  const totalGuideWidth = screenWidth * 0.9;  // 화면 폭의 90%
  const totalGuideHeight = Math.max(cardGuideHeight * 1.8, screenHeight * 0.4);

  // 가이드 영역 중앙 위치 계산
  const guideLeft = (screenWidth - totalGuideWidth) / 2;
  const guideTop = (screenHeight - totalGuideHeight) / 2;

  // 카드 가이드 중앙 위치 계산
  const cardLeft = (screenWidth - cardGuideWidth) / 2;
  const cardTop = guideTop + (totalGuideHeight - cardGuideHeight) / 2 - 20; // 약간 위로

  // 손/손가락 텍스트
  const handText = selectedHand === 'left' ? '왼손' : '오른손';
  const fingerText = isThumbOnly ? '엄지' : '검지~새끼';

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
      >
        <Text style={styles.cardGuideText}>신용카드</Text>
      </View>

      {/* 상단 안내 */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>
          {handText} {fingerText} 촬영
        </Text>
        <Text style={styles.instructionText}>
          {isThumbOnly
            ? '엄지손톱이 카드 위에 오도록 펴서 촬영해주세요'
            : '4개 손톱이 카드 위에 오도록 가지런히 펴서 촬영해주세요'
          }
        </Text>
      </View>

      {/* 촬영 팁 (하단) */}
      <View style={styles.tipContainer}>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>신용카드를 황금색 영역에 맞춰주세요</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>밝은 곳에서 손톱이 잘 보이게 촬영해주세요</Text>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cardGuide: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGuideText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  instructionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipContainer: {
    position: 'absolute',
    bottom: 130,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipBullet: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default CameraGuideOverlay;
