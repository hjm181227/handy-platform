/**
 * AI 기반 손톱 자동 측정 화면
 *
 * 플로우:
 * 1. 촬영된 이미지 표시
 * 2. AI 모델로 손톱 영역 자동 감지
 * 3. 측정 결과 오버레이로 표시
 * 4. 결과 확인 및 저장
 */

import React, { useState, useEffect } from 'react';
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
// nailMeasurementService는 useEffect 내에서 lazy import
// Svg, Rect는 서버 오버레이 방식으로 변경되어 더 이상 필요 없음
// 모듈 레벨에서 import하면 react-native-fast-tflite가 로드되어
// Hermes 엔진에서 "property is not configurable" 에러 발생
import {
  NailMeasurementResult,
  FingerType,
  MODEL_INPUT_SIZE,
  CARD_GUIDE_WIDTH_MOBILE,
  CARD_GUIDE_WIDTH_TABLET,
  TABLET_BREAKPOINT,
  NailRegion,
} from '../../services/nailMeasurement/types';
import {
  findConnectedComponents,
  validateNailRegions,
} from '../../services/nailMeasurement/imageProcessor';
import { userService } from '../../services/apiService';

// nailMeasurementService를 lazy하게 가져오는 함수
// index.ts를 통하지 않고 직접 NailMeasurementService.ts를 require
// (index.ts가 모듈 체인을 로드하면서 TFLite 에러 발생 방지)
let cachedService: any = null;
const getNailMeasurementService = () => {
  if (!cachedService) {
    try {
      const module = require('../../services/nailMeasurement/NailMeasurementService');
      cachedService = module.nailMeasurementService;
      console.log('[AIMeasurementScreen] NailMeasurementService loaded successfully');
    } catch (error) {
      console.error('[AIMeasurementScreen] Failed to load NailMeasurementService:', error);
      throw error;
    }
  }
  return cachedService;
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

const AIMeasurementScreen: React.FC<AIMeasurementScreenProps> = ({
  selectedHand,
  selectedFinger: _,
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
  const [showDebugInfo, setShowDebugInfo] = useState(__DEV__);  // 개발 모드에서만 디버그 정보 표시
  const [detectedRegions, setDetectedRegions] = useState<NailRegion[]>([]);  // Stage 3: 감지된 영역

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

      // Stage 3: 감지된 영역 저장 (디버그용)
      if (result.mask) {
        const regions = findConnectedComponents(result.mask);
        setDetectedRegions(regions);
        const regionValidation = validateNailRegions(regions, isThumbOnly);
        console.log('[AIMeasurementScreen] Region validation:', regionValidation);
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

  // 마스크 오버레이 렌더링 (서버에서 생성된 오버레이 이미지 사용)
  const renderMaskOverlay = () => {
    if (!measurementResult?.maskOverlayBase64 || !imageLayout || !showOverlay) return null;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={{ uri: `data:image/png;base64,${measurementResult.maskOverlayBase64}` }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
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

  // Stage 3: 디버그 정보 패널 렌더링
  const renderDebugInfo = () => {
    if (!showDebugInfo || !measurementResult) return null;

    const isTablet = SCREEN_WIDTH >= TABLET_BREAKPOINT;
    const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
    const cardToScreenRatio = cardGuideWidth / SCREEN_WIDTH;
    const estimatedCardWidth = MODEL_INPUT_SIZE * cardToScreenRatio;

    return (
      <View style={styles.debugPanel}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugTitle}>Debug Info (Stage 3 & 4)</Text>
          <TouchableOpacity onPress={() => setShowDebugInfo(false)}>
            <Text style={styles.debugCloseBtn}>×</Text>
          </TouchableOpacity>
        </View>

        {/* 캘리브레이션 정보 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Calibration (Stage 4)</Text>
          <Text style={styles.debugText}>Screen Width: {SCREEN_WIDTH}px</Text>
          <Text style={styles.debugText}>Card Guide: {cardGuideWidth}px ({isTablet ? 'tablet' : 'mobile'})</Text>
          <Text style={styles.debugText}>Card-to-Screen Ratio: {cardToScreenRatio.toFixed(3)}</Text>
          <Text style={styles.debugText}>Estimated Card (in model): {estimatedCardWidth.toFixed(1)}px</Text>
          <Text style={styles.debugText}>Pixel-to-mm Ratio: {measurementResult.pixelToMmRatio.toFixed(4)} mm/px</Text>
        </View>

        {/* 감지된 영역 정보 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Detected Regions (Stage 3)</Text>
          <Text style={styles.debugText}>Expected: {isThumbOnly ? 1 : 4} region(s)</Text>
          <Text style={styles.debugText}>Detected: {detectedRegions.length} region(s)</Text>

          {detectedRegions.map((region, idx) => (
            <View key={region.id} style={styles.debugRegion}>
              <Text style={styles.debugRegionTitle}>Region {idx}</Text>
              <Text style={styles.debugText}>Area: {region.area}px</Text>
              <Text style={styles.debugText}>Center: ({region.centerX.toFixed(1)}, {region.centerY.toFixed(1)})</Text>
              <Text style={styles.debugText}>
                BBox: ({region.boundingBox.x}, {region.boundingBox.y}) {region.boundingBox.width}×{region.boundingBox.height}
              </Text>
            </View>
          ))}
        </View>

        {/* 측정 결과 정보 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Measurements (Stage 4)</Text>
          {measurementResult.measurements.map((m) => (
            <Text key={m.finger} style={styles.debugText}>
              {m.finger}: {m.widthPixels}px → {m.widthMm}mm
            </Text>
          ))}
        </View>
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
          {/* 크롭된 이미지 표시: 서버 base64 > 로컬 URI > 원본 이미지 */}
          <Image
            source={{
              uri: measurementResult?.croppedImageBase64
                ? `data:image/png;base64,${measurementResult.croppedImageBase64}`
                : measurementResult?.croppedImageUri || imageUri
            }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          {/* 마스크 오버레이 (녹색 반투명) */}
          {renderMaskOverlay()}
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

        {/* Stage 3 & 4: 디버그 정보 패널 */}
        {renderDebugInfo()}

        {/* 디버그 토글 버튼 (개발 모드) */}
        {__DEV__ && !isAnalyzing && measurementResult && !showDebugInfo && (
          <TouchableOpacity
            style={styles.debugToggleBtn}
            onPress={() => setShowDebugInfo(true)}
          >
            <Text style={styles.debugToggleBtnText}>Show Debug</Text>
          </TouchableOpacity>
        )}
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
  // Stage 3 & 4: 디버그 패널 스타일
  debugPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugTitle: {
    color: '#00FF00',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  debugCloseBtn: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  debugSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  debugSectionTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  debugText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  debugRegion: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  debugRegionTitle: {
    color: '#00BFFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  debugToggleBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  debugToggleBtnText: {
    color: '#00FF00',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});

export default AIMeasurementScreen;
