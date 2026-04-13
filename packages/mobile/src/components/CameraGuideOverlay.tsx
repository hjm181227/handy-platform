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
import { NMColors } from '../styles/nailMeasurementTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraGuideOverlayProps {
  visible: boolean;
  isThumbOnly?: boolean;
  selectedHand?: 'left' | 'right';
}

// 손가락별 높이 (하단 정렬, 중지가 가장 높음)
const FINGERS_RIGHT = [
  { label: '검지', height: 63 },
  { label: '중지', height: 75 },
  { label: '약지', height: 70 },
  { label: '소지', height: 55 },
];
// 왼손: 카메라로 촬영 시 좌→우 소지/약지/중지/검지
const FINGERS_LEFT = [
  { label: '소지', height: 55 },
  { label: '약지', height: 70 },
  { label: '중지', height: 75 },
  { label: '검지', height: 63 },
];

const CameraGuideOverlay: React.FC<CameraGuideOverlayProps> = ({
  visible,
  isThumbOnly = true,
  selectedHand = 'right',
}) => {
  if (!visible) return null;

  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
  const cardGuideHeight = cardGuideWidth / CARD_ASPECT_RATIO;

  const totalGuideHeight = Math.max(cardGuideHeight * 1.8, screenHeight * 0.4);

  const guideTop = (screenHeight - totalGuideHeight) / 2;
  const cardLeft = (screenWidth - cardGuideWidth) / 2;
  const cardTop = guideTop + (totalGuideHeight - cardGuideHeight) / 2 - 20;

  // Nail guide positions — inside the card area, vertically centered
  const nailHeight = isThumbOnly ? 90 : 75;
  const nailGuideTop = cardTop + (cardGuideHeight - nailHeight) / 2;

  return (
    <View style={styles.overlay}>
      {/* 어둡게 처리된 배경 */}
      <View style={styles.darkBackground} />

      {/* 카드 가이드 — 금색 실선 */}
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
        <View style={styles.cardLabel}>
          <Text style={styles.cardLabelText}>신용카드 영역</Text>
        </View>
      </View>

      {/* 손톱 가이드 */}
      {isThumbOnly ? (
        // 엄지 모드: 1개 보라색 가이드
        <View style={[
          styles.thumbGuide,
          {
            left: (screenWidth - 60) / 2,
            top: nailGuideTop,
          },
        ]}>
          <View style={styles.thumbNailLabel}>
            <Icon name="move" />
            <Text style={styles.thumbNailLabelText}>손톱 위치</Text>
          </View>
        </View>
      ) : (
        // 4손가락 모드: 4개 보라색 가이드
        <View style={[
          styles.fourFingerContainer,
          {
            top: nailGuideTop,
            left: (screenWidth - (45 * 4 + 8 * 3)) / 2,
          },
        ]}>
          {(selectedHand === 'left' ? FINGERS_LEFT : FINGERS_RIGHT).map(({ label, height }) => (
            <View key={label} style={[styles.fingerGuide, { height }]}>
              <Text style={styles.fingerGuideLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 촬영 팁 */}
      <View style={styles.tipContainer}>
        <View style={styles.tipItem}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>신용카드를 황금색 영역에 맞춰주세요</Text>
        </View>
        <View style={styles.tipItem}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>밝은 곳에서 손톱이 잘 보이게 촬영해주세요</Text>
        </View>
      </View>
    </View>
  );
};

// Inline Icon component to avoid extra import for a single icon
const Icon: React.FC<{ name: string }> = () => null; // move icon is decorative, skip

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  darkBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Card guide — solid gold border
  cardGuide: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: NMColors.gold,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    paddingTop: 10,
  },
  cardLabel: {
    backgroundColor: NMColors.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardLabelText: {
    color: NMColors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  // Thumb nail guide
  thumbGuide: {
    position: 'absolute',
    width: 60,
    height: 90,
    borderWidth: 3,
    borderColor: NMColors.purple,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  thumbNailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NMColors.purpleLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  thumbNailLabelText: {
    color: NMColors.purple,
    fontSize: 10,
    fontWeight: '600',
  },
  // Four fingers guide
  fourFingerContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  fingerGuide: {
    width: 45,
    borderWidth: 3,
    borderColor: NMColors.purple,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  fingerGuideLabel: {
    color: NMColors.purple,
    fontSize: 10,
    fontWeight: '600',
  },
  // Tips
  tipContainer: {
    position: 'absolute',
    bottom: 115,
    left: 24,
    right: 24,
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NMColors.purple,
  },
  tipText: {
    flex: 1,
    color: NMColors.whiteTranslucent,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CameraGuideOverlay;
