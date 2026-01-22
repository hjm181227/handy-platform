/**
 * AI 기반 손톱 자동 측정 화면
 *
 * 플로우:
 * 1. 촬영된 이미지 표시
 * 2. AI 모델로 손톱 영역 자동 감지
 * 3. 측정 결과 오버레이로 표시
 * 4. 결과 확인 및 저장
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
// nailMeasurementService는 useEffect 내에서 lazy import
// 모듈 레벨에서 import하면 react-native-fast-tflite가 로드되어
// Hermes 엔진에서 "property is not configurable" 에러 발생
import {
  NailMeasurementResult,
  FingerNailMeasurement,
  FingerType,
  MODEL_INPUT_SIZE,
  SEGMENTATION_THRESHOLD,
  CARD_GUIDE_WIDTH_MOBILE,
  CARD_GUIDE_WIDTH_TABLET,
  TABLET_BREAKPOINT,
} from '../../services/nailMeasurement/types';
import { userService } from '../../services/apiService';

// nailMeasurementService를 lazy하게 가져오는 함수
const getNailMeasurementService = () => {
  const { nailMeasurementService } = require('../../services/nailMeasurement');
  return nailMeasurementService;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIMeasurementScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  imageUri: string;
  isThumbOnly?: boolean;  // true면 엄지만, false면 4손가락
  initialMeasurementResult?: NailMeasurementResult;  // CameraScreen에서 미리 계산된 결과
  onComplete: () => void;
  onBack: () => void;
  onRetake: () => void;
  onNavigateToSizes?: () => void;
}

// 손가락 한글명 매핑
const FINGER_KOREAN: Record<FingerType, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  little: '새끼',
};

// 손가락 영문명 배열 (저장 순서)
const FINGER_ORDER: FingerType[] = ['thumb', 'index', 'middle', 'ring', 'little'];
const FOUR_FINGERS: FingerType[] = ['index', 'middle', 'ring', 'little'];

const AIMeasurementScreen: React.FC<AIMeasurementScreenProps> = ({
  selectedHand,
  selectedFinger,
  imageUri,
  isThumbOnly = true,
  initialMeasurementResult,
  onComplete,
  onBack,
  onRetake,
  onNavigateToSizes,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(!initialMeasurementResult);
  const [measurementResult, setMeasurementResult] = useState<NailMeasurementResult | null>(
    initialMeasurementResult || null
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);  // 오버레이 표시 여부

  // 이미지 분석 실행 (미리 계산된 결과가 없는 경우에만)
  useEffect(() => {
    if (initialMeasurementResult) {
      console.log('[AIMeasurementScreen] Using pre-computed measurement result');
      setMeasurementResult(initialMeasurementResult);
      setIsAnalyzing(false);
    } else {
      analyzeImage();
    }
  }, [imageUri, initialMeasurementResult]);

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('[AIMeasurementScreen] Starting analysis...');
      console.log('[AIMeasurementScreen] imageUri:', imageUri);
      console.log('[AIMeasurementScreen] isThumbOnly:', isThumbOnly);

      // AI 모델 초기화 (lazy import)
      const service = getNailMeasurementService();
      const initSuccess = await service.initialize();
      console.log('[AIMeasurementScreen] Model initialized:', initSuccess);

      // 카드 폭 계산 (고정 픽셀 기반)
      // 화면 대비 카드 가이드 비율로 모델 공간에서 카드 폭 계산
      // 카드 가이드: 모바일 280px, 태블릿 400px (고정 크기)
      const isTablet = SCREEN_WIDTH >= TABLET_BREAKPOINT;
      const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
      const cardToScreenRatio = cardGuideWidth / SCREEN_WIDTH;
      const estimatedCardWidth = MODEL_INPUT_SIZE * cardToScreenRatio;
      console.log('[AIMeasurementScreen] Card calculation:', {
        screenWidth: SCREEN_WIDTH,
        isTablet,
        cardGuideWidth,
        cardToScreenRatio,
        estimatedCardWidth,
      });

      // AI 측정 실행
      let result: NailMeasurementResult;
      if (isThumbOnly) {
        result = await service.measureThumb(imageUri, estimatedCardWidth);
      } else {
        result = await service.measureFourFingers(imageUri, estimatedCardWidth);
      }

      console.log('[AIMeasurementScreen] Measurement result:', JSON.stringify(result, null, 2));

      // 결과 검증
      const validation = service.validateMeasurements(result.measurements);
      if (!validation.isValid) {
        console.warn('Measurement validation warnings:', validation.warnings);
      }

      setMeasurementResult(result);

    } catch (err: any) {
      console.error('[AIMeasurementScreen] AI 분석 실패:', err);
      console.error('[AIMeasurementScreen] Error stack:', err.stack);
      setError(err.message || 'AI 분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAll = async () => {
    if (!measurementResult || measurementResult.measurements.length === 0) return;

    try {
      setIsSaving(true);

      // 모든 측정 결과 저장
      const savePromises = measurementResult.measurements.map(m =>
        userService.updateNailSize(selectedHand, m.finger, m.widthMm)
      );

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        const fingerList = measurementResult.measurements
          .map(m => `${FINGER_KOREAN[m.finger]}: ${m.widthMm}mm`)
          .join('\n');

        Alert.alert(
          '측정 완료!',
          `${selectedHand === 'left' ? '왼손' : '오른손'} ${isThumbOnly ? '엄지' : '4손가락'}\n\n${fingerList}`,
          [
            {
              text: '확인',
              onPress: () => {
                if (onNavigateToSizes) {
                  onNavigateToSizes();
                } else {
                  onComplete();
                }
              },
            },
          ]
        );
      } else {
        throw new Error('일부 측정 결과 저장에 실패했습니다.');
      }
    } catch (err: any) {
      Alert.alert('저장 실패', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 다운샘플링된 마스크 블록 데이터 생성 (성능 최적화)
  const maskBlocks = useMemo(() => {
    if (!measurementResult?.mask || !imageLayout) return [];

    const mask = measurementResult.mask;
    const blocks: { x: number; y: number; width: number; height: number }[] = [];

    // 다운샘플링: 4x4 블록 단위로 처리 (256/4 = 64개)
    const blockSize = 4;
    const numBlocks = MODEL_INPUT_SIZE / blockSize;
    const scaleX = imageLayout.width / MODEL_INPUT_SIZE;
    const scaleY = imageLayout.height / MODEL_INPUT_SIZE;

    for (let by = 0; by < numBlocks; by++) {
      for (let bx = 0; bx < numBlocks; bx++) {
        // 블록 내 평균값 계산
        let sum = 0;
        for (let dy = 0; dy < blockSize; dy++) {
          for (let dx = 0; dx < blockSize; dx++) {
            const y = by * blockSize + dy;
            const x = bx * blockSize + dx;
            sum += mask[y]?.[x] || 0;
          }
        }
        const avg = sum / (blockSize * blockSize);

        // threshold 이상이면 블록 추가
        if (avg >= SEGMENTATION_THRESHOLD) {
          blocks.push({
            x: bx * blockSize * scaleX,
            y: by * blockSize * scaleY,
            width: blockSize * scaleX,
            height: blockSize * scaleY,
          });
        }
      }
    }

    return blocks;
  }, [measurementResult?.mask, imageLayout]);

  // 마스크 오버레이 렌더링 (Prediction Overlay 스타일)
  const renderMaskOverlay = () => {
    if (!measurementResult?.mask || !imageLayout || !showOverlay) return null;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={imageLayout.width} height={imageLayout.height}>
          {maskBlocks.map((block, index) => (
            <Rect
              key={index}
              x={block.x}
              y={block.y}
              width={block.width}
              height={block.height}
              fill="rgba(0, 255, 0, 0.5)"
            />
          ))}
        </Svg>
      </View>
    );
  };

  // 바운딩 박스 오버레이 (측정 결과 표시용)
  const renderBoundingBoxOverlay = () => {
    if (!measurementResult || !imageLayout || !showOverlay) return null;

    const scaleX = imageLayout.width / MODEL_INPUT_SIZE;
    const scaleY = imageLayout.height / MODEL_INPUT_SIZE;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {measurementResult.measurements.map((m) => {
          const { boundingBox } = m;
          if (!boundingBox) return null;

          const scaledBox = {
            x: boundingBox.x * scaleX,
            y: boundingBox.y * scaleY,
            width: boundingBox.width * scaleX,
            height: boundingBox.height * scaleY,
          };

          return (
            <View
              key={m.finger}
              style={[
                styles.detectionBox,
                {
                  left: scaledBox.x,
                  top: scaledBox.y,
                  width: scaledBox.width,
                  height: scaledBox.height,
                },
              ]}
            >
              <Text style={styles.detectionLabel}>
                {FINGER_KOREAN[m.finger]} {m.widthMm}mm
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMeasurementResults = () => {
    if (!measurementResult) return null;

    return (
      <View style={styles.resultsCard}>
        <Text style={styles.resultsTitle}>측정 결과</Text>
        <Text style={styles.resultsSubtitle}>
          {selectedHand === 'left' ? '왼손' : '오른손'} {isThumbOnly ? '엄지' : '4손가락'}
        </Text>

        <View style={styles.measurementsList}>
          {measurementResult.measurements.map((m) => (
            <View key={m.finger} style={styles.measurementItem}>
              <View style={styles.fingerInfo}>
                <Text style={styles.fingerName}>{FINGER_KOREAN[m.finger]}</Text>
                {m.confidence < 0.8 && (
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>확인 필요</Text>
                  </View>
                )}
              </View>
              <Text style={styles.measurementValue}>{m.widthMm}mm</Text>
            </View>
          ))}
        </View>

        <Text style={styles.processingTime}>
          분석 시간: {(measurementResult.processingTimeMs / 1000).toFixed(1)}초
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>측정 결과</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 이미지 미리보기 + 마스크 오버레이 */}
        <TouchableOpacity
          style={styles.imagePreview}
          onPress={() => setShowOverlay(!showOverlay)}
          activeOpacity={0.9}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setImageLayout({ width, height });
          }}
        >
          {/* 크롭된 이미지 또는 원본 이미지 표시 */}
          <Image
            source={{ uri: measurementResult?.croppedImageUri || imageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          {/* 마스크 오버레이 (녹색 반투명) */}
          {renderMaskOverlay()}
          {/* 바운딩 박스 + 측정값 표시 */}
          {renderBoundingBoxOverlay()}
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.analyzingText}>AI가 분석 중...</Text>
            </View>
          )}
          {/* 오버레이 토글 힌트 */}
          {!isAnalyzing && measurementResult && (
            <View style={styles.overlayHint}>
              <Text style={styles.overlayHintText}>
                {showOverlay ? '탭하여 감지 영역 숨기기' : '탭하여 감지 영역 보기'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 분석 중 */}
        {isAnalyzing && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.statusText}>손톱 영역을 분석하고 있습니다...</Text>
          </View>
        )}

        {/* 에러 */}
        {!isAnalyzing && error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={analyzeImage}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 측정 결과 */}
        {!isAnalyzing && !error && measurementResult && renderMeasurementResults()}
      </ScrollView>

      {/* 하단 버튼 */}
      {!isAnalyzing && !error && measurementResult && (
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onRetake}
          >
            <Text style={styles.secondaryButtonText}>다시 촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>저장하기</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    color: '#212529',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,  // 크롭된 이미지는 1:1 정사각형
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 4,
  },
  detectionLabel: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: '#00FF00',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  overlayHint: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayHintText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFF',
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    color: '#495057',
  },
  errorCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
  },
  measurementsList: {
    gap: 12,
  },
  measurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  fingerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fingerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  warningBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '500',
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  processingTime: {
    fontSize: 12,
    color: '#ADB5BD',
    textAlign: 'center',
    marginTop: 16,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default AIMeasurementScreen;
