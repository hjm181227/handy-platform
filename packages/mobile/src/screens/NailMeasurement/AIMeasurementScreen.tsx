/**
 * AI 기반 손톱 자동 측정 화면
 *
 * 플로우:
 * 1. 촬영된 이미지 표시
 * 2. AI 모델로 손톱 영역 자동 감지
 * 3. 측정 결과 오버레이로 표시
 * 4. 결과 확인 및 저장
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  NailMeasurementResult,
  FingerType,
  MODEL_INPUT_SIZE,
  CARD_GUIDE_WIDTH_MOBILE,
  CARD_GUIDE_WIDTH_TABLET,
  TABLET_BREAKPOINT,
  CAMERA_SENSOR_ASPECT_RATIO,
  NailRegion,
} from '../../services/nailMeasurement/types';
import {
  findConnectedComponents,
  validateNailRegions,
} from '../../services/nailMeasurement/imageProcessor';
import { userService } from '../../services/apiService';
import { alertService } from '@handy-platform/shared/src/services/utils/AlertService';
import { NMColors } from '../../styles/nailMeasurementTheme';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AIMeasurementScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  imageUri: string;
  isThumbOnly?: boolean;
  initialMeasurementResult?: NailMeasurementResult;
  onComplete: () => void;
  onBack: () => void;
  onRetake: () => void;
  onNavigateToSizes?: () => void;
}

const FINGER_KOREAN: Record<FingerType, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  little: '소지',
};

// Analysis steps for loading UI
type StepStatus = 'done' | 'active' | 'pending';

interface AnalysisStep {
  label: string;
  status: StepStatus;
}

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
  const [showOverlay, setShowOverlay] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(__DEV__);
  const [detectedRegions, setDetectedRegions] = useState<NailRegion[]>([]);
  const [progress, setProgress] = useState(0);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { label: '이미지 촬영 완료', status: 'done' },
    { label: '신용카드 인식 완료', status: 'pending' },
    { label: '손톱 영역 분석 중...', status: 'pending' },
    { label: '사이즈 계산', status: 'pending' },
  ]);

  // Pulse animation for loading
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnalyzing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isAnalyzing, pulseAnim]);

  // Simulate progress updates during analysis
  useEffect(() => {
    if (!isAnalyzing) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      setProgress(30);
      setAnalysisSteps(prev => prev.map((s, i) =>
        i === 1 ? { ...s, status: 'active' } : s
      ));
    }, 500));

    timers.push(setTimeout(() => {
      setProgress(50);
      setAnalysisSteps(prev => prev.map((s, i) =>
        i === 1 ? { ...s, status: 'done', label: '신용카드 인식 완료' } :
        i === 2 ? { ...s, status: 'active' } : s
      ));
    }, 1500));

    timers.push(setTimeout(() => {
      setProgress(70);
    }, 2500));

    return () => timers.forEach(clearTimeout);
  }, [isAnalyzing]);

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
    setProgress(0);
    setAnalysisSteps([
      { label: '이미지 촬영 완료', status: 'done' },
      { label: '신용카드 인식 중...', status: 'pending' },
      { label: '손톱 영역 분석 중...', status: 'pending' },
      { label: '사이즈 계산', status: 'pending' },
    ]);

    try {
      console.log('[AIMeasurementScreen] Starting analysis...');
      console.log('[AIMeasurementScreen] imageUri:', imageUri);
      console.log('[AIMeasurementScreen] isThumbOnly:', isThumbOnly);

      const service = getNailMeasurementService();

      const isTablet = SCREEN_WIDTH >= TABLET_BREAKPOINT;
      const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
      const actualPreviewWidth = SCREEN_HEIGHT * CAMERA_SENSOR_ASPECT_RATIO;
      const cardToPreviewRatio = cardGuideWidth / actualPreviewWidth;
      const estimatedCardWidth = MODEL_INPUT_SIZE * cardToPreviewRatio;

      console.log('[AIMeasurementScreen] Card calculation (sensor-based):', {
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
        isTablet,
        cardGuideWidth,
        sensorAspectRatio: CAMERA_SENSOR_ASPECT_RATIO,
        actualPreviewWidth,
        cardToPreviewRatio,
        estimatedCardWidth,
      });

      let result: NailMeasurementResult;
      if (isThumbOnly) {
        result = await service.measureThumb(imageUri, estimatedCardWidth);
      } else {
        result = await service.measureFourFingers(imageUri, estimatedCardWidth, selectedHand);
      }

      // Update steps to completion
      setProgress(100);
      setAnalysisSteps([
        { label: '이미지 촬영 완료', status: 'done' },
        { label: '신용카드 인식 완료', status: 'done' },
        { label: '손톱 영역 분석 완료', status: 'done' },
        { label: '사이즈 계산 완료', status: 'done' },
      ]);

      console.log('[AIMeasurementScreen] Measurement result:', JSON.stringify(result, null, 2));

      const validation = service.validateMeasurements(result.measurements);
      if (!validation.isValid) {
        console.warn('Measurement validation warnings:', validation.warnings);
      }

      if (result.mask && result.mask.length > 0) {
        const regions = findConnectedComponents(result.mask);
        setDetectedRegions(regions);
        const regionValidation = validateNailRegions(regions, isThumbOnly);
        console.log('[AIMeasurementScreen] Region validation:', regionValidation);
      }

      setMeasurementResult(result);

    } catch (err: any) {
      console.error('[AIMeasurementScreen] AI 분석 실패:', err);
      console.error('[AIMeasurementScreen] Error stack:', err.stack);
      const errorMsg = err.message || 'AI 분석에 실패했습니다.';
      setError(errorMsg);
      // Release 빌드에서도 에러 확인 가능하도록 Alert 표시
      Alert.alert('분석 오류', errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAll = async () => {
    if (!measurementResult || measurementResult.measurements.length === 0) return;

    try {
      setIsSaving(true);

      const savePromises = measurementResult.measurements.map(m =>
        userService.updateNailSize(selectedHand, m.finger, m.widthMm)
      );

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        const fingerList = measurementResult.measurements
          .map(m => `${FINGER_KOREAN[m.finger]}: ${m.widthMm}mm`)
          .join('\n');

        alertService.toast(fingerList, {
          title: '저장 완료',
          variant: 'success',
          duration: 3000,
        });

        if (onNavigateToSizes) {
          onNavigateToSizes();
        } else {
          onComplete();
        }
      } else {
        throw new Error('일부 측정 결과 저장에 실패했습니다.');
      }
    } catch (err: any) {
      alertService.toast(err.message, {
        title: '저장 실패',
        variant: 'danger',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // V2 Loading UI
  const renderLoadingUI = () => {
    return (
      <View style={styles.loadingContainer}>
        {/* Concentric circles animation */}
        <Animated.View style={[styles.scanAnimContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.concentricCircle, styles.circle1]} />
          <View style={[styles.concentricCircle, styles.circle2]} />
          <View style={[styles.concentricCircle, styles.circle3]} />
          <Icon name="maximize" size={40} color={NMColors.purple} />
        </Animated.View>

        {/* Text */}
        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingTitle}>손톱 사이즈 분석 중</Text>
          <Text style={styles.loadingSubtitle}>AI가 손톱 영역을 인식하고 있어요</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {analysisSteps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              {step.status === 'done' ? (
                <View style={styles.stepIconDone}>
                  <Icon name="check" size={12} color={NMColors.white} />
                </View>
              ) : step.status === 'active' ? (
                <ActivityIndicator size="small" color={NMColors.purple} style={styles.stepSpinner} />
              ) : (
                <View style={styles.stepIconPending} />
              )}
              <Text style={[
                styles.stepText,
                step.status === 'done' && styles.stepTextDone,
                step.status === 'active' && styles.stepTextActive,
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // V2 Result UI
  const renderResultUI = () => {
    if (!measurementResult) return null;

    const handText = selectedHand === 'left' ? '왼손' : '오른손';
    const fingerText = isThumbOnly ? '엄지' : '4손가락';

    return (
      <>
        <ScrollView style={styles.resultContent} contentContainerStyle={styles.resultContentContainer}>
          {/* Success badge */}
          <View style={styles.successBadge}>
            <Icon name="check" size={16} color={NMColors.green} />
            <Text style={styles.successBadgeText}>손톱 인식 성공</Text>
          </View>

          {/* Image area */}
          <TouchableOpacity
            style={isThumbOnly ? styles.imageArea : styles.imageAreaFourFinger}
            onPress={() => setShowOverlay(!showOverlay)}
            activeOpacity={0.9}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setImageLayout({ width, height });
            }}
          >
            <Image
              source={{
                uri: measurementResult?.croppedImageBase64
                  ? `data:image/png;base64,${measurementResult.croppedImageBase64}`
                  : measurementResult?.croppedImageUri || imageUri
              }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            {/* Mask overlay */}
            {measurementResult?.maskOverlayBase64 && imageLayout && showOverlay && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Image
                  source={{ uri: `data:image/png;base64,${measurementResult.maskOverlayBase64}` }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Info label */}
          <Text style={styles.resultInfoLabel}>
            {handText} {fingerText} 측정 결과 (mm)
          </Text>

          {/* Measurement cards */}
          {isThumbOnly ? (
            measurementResult.measurements.map((m) => (
              <View key={m.finger} style={styles.sizeCard}>
                <Text style={styles.sizeCardLabel}>손톱 가로 길이</Text>
                <View style={styles.sizeCardValueRow}>
                  <Text style={styles.sizeCardValue}>{m.widthMm}</Text>
                  <Text style={styles.sizeCardUnit}>mm</Text>
                </View>
                <Text style={styles.sizeCardNote}>
                  신용카드 기준으로 측정되었습니다
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.sizeGrid}>
              {(['index', 'middle', 'ring', 'little'] as FingerType[])
                .map(f => measurementResult.measurements.find(m => m.finger === f))
                .filter(Boolean)
                .map((m) => (
                <View key={m!.finger} style={styles.sizeGridCell}>
                  <Text style={styles.sizeGridCellLabel}>{FINGER_KOREAN[m!.finger]}</Text>
                  <Text style={styles.sizeGridCellValue}>{m!.widthMm}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Debug info (dev only) */}
          {renderDebugInfo()}
          {__DEV__ && !isAnalyzing && measurementResult && !showDebugInfo && (
            <TouchableOpacity
              style={styles.debugToggleBtn}
              onPress={() => setShowDebugInfo(true)}
            >
              <Text style={styles.debugToggleBtnText}>Show Debug</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={NMColors.white} />
            ) : (
              <>
                <Icon name="check" size={20} color={NMColors.white} />
                <Text style={styles.primaryButtonText}>저장하기</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onRetake}
          >
            <Icon name="refresh-cw" size={18} color={NMColors.textSecondary} />
            <Text style={styles.secondaryButtonText}>다시 측정하기</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Debug info panel
  const renderDebugInfo = () => {
    if (!showDebugInfo || !measurementResult) return null;

    const isTablet = SCREEN_WIDTH >= TABLET_BREAKPOINT;
    const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
    const actualPreviewWidth = SCREEN_HEIGHT * CAMERA_SENSOR_ASPECT_RATIO;
    const cardToPreviewRatio = cardGuideWidth / actualPreviewWidth;
    const estimatedCardWidth = MODEL_INPUT_SIZE * cardToPreviewRatio;

    return (
      <View style={styles.debugPanel}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugTitle}>Debug Info (Stage 3 & 4)</Text>
          <TouchableOpacity onPress={() => setShowDebugInfo(false)}>
            <Text style={styles.debugCloseBtn}>x</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Calibration (Stage 4)</Text>
          <Text style={styles.debugText}>Screen: {SCREEN_WIDTH}x{SCREEN_HEIGHT}px</Text>
          <Text style={styles.debugText}>Card Guide: {cardGuideWidth}px ({isTablet ? 'tablet' : 'mobile'})</Text>
          <Text style={styles.debugText}>Sensor Ratio: {CAMERA_SENSOR_ASPECT_RATIO.toFixed(3)} (3:4)</Text>
          <Text style={styles.debugText}>Actual Preview Width: {actualPreviewWidth.toFixed(1)}px</Text>
          <Text style={styles.debugText}>Card-to-Preview: {cardToPreviewRatio.toFixed(3)}</Text>
          <Text style={styles.debugText}>Card in Model: {estimatedCardWidth.toFixed(1)}px</Text>
          <Text style={styles.debugText}>Pixel-to-mm: {measurementResult.pixelToMmRatio.toFixed(4)} mm/px</Text>
        </View>

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
                BBox: ({region.boundingBox.x}, {region.boundingBox.y}) {region.boundingBox.width}x{region.boundingBox.height}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Measurements (Stage 4)</Text>
          {measurementResult.measurements.map((m) => (
            <Text key={m.finger} style={styles.debugText}>
              {`${m.finger}: ${m.widthPixels}px → ${m.widthMm}mm`}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // Error UI
  if (!isAnalyzing && error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={NMColors.white} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Icon name="x" size={20} color={NMColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>측정 오류</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={analyzeImage}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={NMColors.white} />

      {isAnalyzing ? (
        renderLoadingUI()
      ) : measurementResult ? (
        <>
          {/* Result header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Icon name="x" size={20} color={NMColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isThumbOnly ? '측정 완료' : '4손가락 측정 완료'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>
          {renderResultUI()}
        </>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NMColors.white,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NMColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: NMColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 40,
  },

  // ===== Loading UI =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 32,
  },
  scanAnimContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  concentricCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: NMColors.purple,
    borderRadius: 999,
  },
  circle1: {
    width: 160,
    height: 160,
    opacity: 0.15,
  },
  circle2: {
    width: 120,
    height: 120,
    opacity: 0.3,
  },
  circle3: {
    width: 80,
    height: 80,
    opacity: 0.5,
  },
  loadingTextContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NMColors.text,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: NMColors.textSecondary,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
    width: 200,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: NMColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: NMColors.purple,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: NMColors.purple,
  },
  stepsContainer: {
    gap: 12,
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: NMColors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepSpinner: {
    width: 20,
    height: 20,
  },
  stepIconPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: NMColors.border,
  },
  stepText: {
    fontSize: 14,
    color: NMColors.textTertiary,
  },
  stepTextDone: {
    color: NMColors.textSecondary,
  },
  stepTextActive: {
    color: NMColors.purple,
    fontWeight: '500',
  },

  // ===== Result UI =====
  resultContent: {
    flex: 1,
  },
  resultContentContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NMColors.greenLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  successBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: NMColors.green,
  },
  imageArea: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: NMColors.border,
    overflow: 'hidden',
  },
  imageAreaFourFinger: {
    width: '100%' as any,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: NMColors.border,
    borderWidth: 1,
    borderColor: NMColors.border,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  resultInfoLabel: {
    fontSize: 14,
    color: NMColors.textSecondary,
    textAlign: 'center',
  },
  sizeCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NMColors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  sizeCardLabel: {
    fontSize: 13,
    color: NMColors.textTertiary,
  },
  sizeCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  sizeCardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: NMColors.text,
  },
  sizeCardUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: NMColors.purple,
  },
  sizeCardNote: {
    fontSize: 12,
    color: NMColors.textSecondary,
  },

  // 4-finger result grid
  sizeGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  sizeGridCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: NMColors.white,
    borderWidth: 1,
    borderColor: NMColors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sizeGridCellLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: NMColors.textSecondary,
  },
  sizeGridCellValue: {
    fontSize: 18,
    fontWeight: '700',
    color: NMColors.purple,
  },

  // Bottom buttons
  bottomButtons: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: NMColors.buttonBg,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: NMColors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: NMColors.white,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: NMColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: NMColors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC3545',
  },
  errorText: {
    fontSize: 15,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: NMColors.buttonBg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: NMColors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // Debug panel
  debugPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
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
