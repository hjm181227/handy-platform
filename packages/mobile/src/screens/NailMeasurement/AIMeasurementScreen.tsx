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
import { Buffer } from 'buffer';
// nailMeasurementService는 useEffect 내에서 lazy import
// 모듈 레벨에서 import하면 react-native-fast-tflite가 로드되어
// Hermes 엔진에서 "property is not configurable" 에러 발생
import {
  NailMeasurementResult,
  FingerNailMeasurement,
  FingerType,
  MODEL_INPUT_SIZE,
  SERVER_MODEL_INPUT_SIZE,
  SEGMENTATION_THRESHOLD,
  CARD_GUIDE_WIDTH_MOBILE,
  CARD_GUIDE_WIDTH_TABLET,
  TABLET_BREAKPOINT,
  NailRegion,
  ServerCalibrationInfo,
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

/**
 * 마스크 배열을 PNG 이미지의 base64 data URI로 변환
 * 녹색 반투명 오버레이로 표시 (정확한 손톱 윤곽선)
 *
 * PNG 형식 사용 이유: 알파 채널 투명도를 올바르게 지원
 * Buffer 기반으로 구현하여 스택 오버플로우 방지
 */
const maskToDataUri = (mask: number[][], threshold: number = SEGMENTATION_THRESHOLD): string => {
  const height = mask.length;
  const width = mask[0]?.length || 0;
  if (width === 0 || height === 0) return '';

  // RGBA 픽셀 데이터 생성 (필터 바이트 포함)
  // 각 행: 1바이트(필터) + width * 4바이트(RGBA)
  const rowBytes = 1 + width * 4;
  const rawDataSize = height * rowBytes;
  const rawData = Buffer.alloc(rawDataSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const value = mask[y][x] || 0;
      if (value >= threshold) {
        // Green with 50% opacity (RGBA)
        rawData[offset++] = 0;    // R
        rawData[offset++] = 255;  // G
        rawData[offset++] = 0;    // B
        rawData[offset++] = 128;  // A (50%)
      } else {
        // Fully transparent
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      }
    }
  }

  // Adler-32 체크섬 계산
  const adler32 = (buf: Buffer): number => {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length; i++) {
      a = (a + buf[i]) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16) | a;
  };

  // CRC32 테이블 생성
  const crc32Table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[n] = c >>> 0;
  }

  // CRC32 계산 (PNG 청크용)
  const crc32 = (buf: Buffer): number => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc = crc32Table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  // Deflate store 방식으로 압축 (실제로는 비압축)
  // zlib header (2) + blocks + adler32 (4)
  const numBlocks = Math.ceil(rawDataSize / 65535);
  const deflatedSize = 2 + numBlocks * 5 + rawDataSize + 4;
  const deflated = Buffer.alloc(deflatedSize);

  let dOffset = 0;
  // zlib header
  deflated[dOffset++] = 0x78;
  deflated[dOffset++] = 0x01;

  // Store blocks
  let remaining = rawDataSize;
  let srcOffset = 0;
  while (remaining > 0) {
    const blockSize = Math.min(remaining, 65535);
    const isFinal = remaining <= 65535 ? 1 : 0;

    deflated[dOffset++] = isFinal;
    deflated[dOffset++] = blockSize & 0xFF;
    deflated[dOffset++] = (blockSize >> 8) & 0xFF;
    deflated[dOffset++] = (~blockSize) & 0xFF;
    deflated[dOffset++] = ((~blockSize) >> 8) & 0xFF;

    rawData.copy(deflated, dOffset, srcOffset, srcOffset + blockSize);
    dOffset += blockSize;
    srcOffset += blockSize;
    remaining -= blockSize;
  }

  // Adler-32 checksum (big-endian)
  const checksum = adler32(rawData);
  deflated[dOffset++] = (checksum >> 24) & 0xFF;
  deflated[dOffset++] = (checksum >> 16) & 0xFF;
  deflated[dOffset++] = (checksum >> 8) & 0xFF;
  deflated[dOffset++] = checksum & 0xFF;

  // PNG 청크 생성 함수
  const createChunk = (type: string, data: Buffer): Buffer => {
    const chunk = Buffer.alloc(4 + 4 + data.length + 4);
    let cOffset = 0;

    // Length (4 bytes, big-endian)
    chunk.writeUInt32BE(data.length, cOffset);
    cOffset += 4;

    // Type (4 bytes)
    chunk.write(type, cOffset, 4, 'ascii');
    cOffset += 4;

    // Data
    data.copy(chunk, cOffset);
    cOffset += data.length;

    // CRC (4 bytes) - CRC of type + data
    const crcBuf = Buffer.alloc(4 + data.length);
    crcBuf.write(type, 0, 4, 'ascii');
    data.copy(crcBuf, 4);
    chunk.writeUInt32BE(crc32(crcBuf), cOffset);

    return chunk;
  };

  // IHDR 데이터
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // Bit depth
  ihdr[9] = 6;  // Color type: RGBA
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  // PNG 파일 조립
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

  return `data:image/png;base64,${png.toString('base64')}`;
};

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

      // 카드 가이드 폭 계산 (고정 픽셀 기반)
      // 카드 가이드: 모바일 280px, 태블릿 400px (고정 크기)
      const isTablet = SCREEN_WIDTH >= TABLET_BREAKPOINT;
      const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;

      console.log('[AIMeasurementScreen] Calibration params:', {
        screenWidth: SCREEN_WIDTH,
        isTablet,
        cardGuideWidth,
        // 서버 기준 계산 (640px)
        cardToScreenRatio: (cardGuideWidth / SCREEN_WIDTH).toFixed(4),
        cardPixelsInModel640: (SERVER_MODEL_INPUT_SIZE * cardGuideWidth / SCREEN_WIDTH).toFixed(1),
      });

      // AI 측정 실행 (서버에서 640x640 기준으로 측정)
      // cardGuideWidth, SCREEN_WIDTH를 서버에 전달
      let result: NailMeasurementResult;
      if (isThumbOnly) {
        result = await service.measureThumb(imageUri, cardGuideWidth, SCREEN_WIDTH);
      } else {
        result = await service.measureFourFingers(imageUri, cardGuideWidth, SCREEN_WIDTH);
      }

      console.log('[AIMeasurementScreen] Measurement result:', JSON.stringify(result, null, 2));

      // 결과 검증
      const validation = service.validateMeasurements(result.measurements);
      if (!validation.isValid) {
        console.warn('Measurement validation warnings:', validation.warnings);
      }

      // Stage 3: 감지된 영역 저장 (디버그용) - 로컬 폴백 시에만 마스크 있음
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

  // 감지된 영역 수 계산
  const detectedRegionsCount = useMemo(() => {
    return measurementResult?.measurements?.length || 0;
  }, [measurementResult?.measurements]);

  // 마스크 오버레이 이미지 URI
  // 서버에서 생성된 오버레이가 있으면 우선 사용, 없으면 클라이언트에서 생성
  const maskImageUri = useMemo(() => {
    // 1. 서버에서 생성된 오버레이가 있으면 사용
    if (measurementResult?.maskOverlayBase64) {
      console.log('[AIMeasurementScreen] Using server-generated mask overlay');
      return `data:image/png;base64,${measurementResult.maskOverlayBase64}`;
    }
    // 2. 폴백: 클라이언트에서 마스크 이미지 생성
    if (measurementResult?.mask) {
      console.log('[AIMeasurementScreen] Generating mask overlay on client (fallback)');
      return maskToDataUri(measurementResult.mask);
    }
    return null;
  }, [measurementResult?.mask, measurementResult?.maskOverlayBase64]);

  // 크롭된 이미지 URI (서버 생성 base64 또는 로컬 파일)
  const croppedImageUri = useMemo(() => {
    // 1. 서버에서 생성된 크롭 이미지가 있으면 사용
    if (measurementResult?.croppedImageBase64) {
      console.log('[AIMeasurementScreen] Using server-generated cropped image');
      return `data:image/png;base64,${measurementResult.croppedImageBase64}`;
    }
    // 2. 로컬에서 생성된 크롭 이미지 URI가 있으면 사용
    if (measurementResult?.croppedImageUri) {
      return measurementResult.croppedImageUri;
    }
    // 3. 폴백: 원본 이미지
    return imageUri;
  }, [measurementResult?.croppedImageBase64, measurementResult?.croppedImageUri, imageUri]);

  // 마스크 오버레이 렌더링 (정확한 마스크 이미지로 표시)
  const renderMaskOverlay = () => {
    if (!maskImageUri || !imageLayout || !showOverlay) return null;

    return (
      <Image
        source={{ uri: maskImageUri }}
        style={[
          StyleSheet.absoluteFill,
          { width: imageLayout.width, height: imageLayout.height },
        ]}
        resizeMode="cover"
        pointerEvents="none"
      />
    );
  };

  // 바운딩 박스 오버레이 (측정 결과 표시용)
  const renderBoundingBoxOverlay = () => {
    if (!measurementResult || !imageLayout || !showOverlay) return null;

    // 서버 모드면 640, 로컬 폴백이면 256 사용
    const modelSize = measurementResult.imageWidth || MODEL_INPUT_SIZE;
    const scaleX = imageLayout.width / modelSize;
    const scaleY = imageLayout.height / modelSize;

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

  // Stage 3: 디버그 정보 패널 렌더링
  const renderDebugInfo = () => {
    if (!showDebugInfo || !measurementResult) return null;

    const isTablet = SCREEN_WIDTH >= TABLET_BREAKPOINT;
    const cardGuideWidth = isTablet ? CARD_GUIDE_WIDTH_TABLET : CARD_GUIDE_WIDTH_MOBILE;
    const cardToScreenRatio = cardGuideWidth / SCREEN_WIDTH;

    // 서버 캘리브레이션 정보 (있으면 서버 측정 사용)
    const serverCal = measurementResult.serverCalibration;
    const isServerMode = !!serverCal;
    const modelInputSize = isServerMode ? SERVER_MODEL_INPUT_SIZE : MODEL_INPUT_SIZE;
    const cardPixelsInModel = modelInputSize * cardToScreenRatio;

    return (
      <View style={styles.debugPanel}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugTitle}>Debug Info (Stage 3 & 4)</Text>
          <TouchableOpacity onPress={() => setShowDebugInfo(false)}>
            <Text style={styles.debugCloseBtn}>×</Text>
          </TouchableOpacity>
        </View>

        {/* 측정 모드 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Measurement Mode</Text>
          <Text style={[
            styles.debugText,
            { color: isServerMode ? '#00FF00' : '#FFD700' }
          ]}>
            {isServerMode
              ? `✓ Server mode (${SERVER_MODEL_INPUT_SIZE}x${SERVER_MODEL_INPUT_SIZE})`
              : `⚠ Local fallback mode (${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE})`}
          </Text>
        </View>

        {/* 캘리브레이션 정보 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Calibration (Stage 4)</Text>
          <Text style={styles.debugText}>Screen Width: {SCREEN_WIDTH}px</Text>
          <Text style={styles.debugText}>Card Guide: {cardGuideWidth}px ({isTablet ? 'tablet' : 'mobile'})</Text>
          <Text style={styles.debugText}>Card-to-Screen Ratio: {cardToScreenRatio.toFixed(4)}</Text>
          <Text style={styles.debugText}>Model Input Size: {modelInputSize}px</Text>
          <Text style={styles.debugText}>Card Pixels (in model): {serverCal?.cardPixelsInModel?.toFixed(1) ?? cardPixelsInModel.toFixed(1)}px</Text>
          <Text style={styles.debugText}>Pixel-to-mm Ratio: {measurementResult.pixelToMmRatio.toFixed(4)} mm/px</Text>
        </View>

        {/* 정확도 비교 (서버 vs 로컬) */}
        {isServerMode && (
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Accuracy Comparison</Text>
            <Text style={styles.debugText}>
              Server (640): {(85.6 / (serverCal?.cardPixelsInModel ?? 1)).toFixed(4)} mm/px
            </Text>
            <Text style={styles.debugText}>
              Local (256): {(85.6 / (MODEL_INPUT_SIZE * cardToScreenRatio)).toFixed(4)} mm/px
            </Text>
            <Text style={[styles.debugText, { color: '#00FF00' }]}>
              → 서버 모드가 {(SERVER_MODEL_INPUT_SIZE / MODEL_INPUT_SIZE).toFixed(1)}x 더 정밀
            </Text>
          </View>
        )}

        {/* 오버레이 생성 방식 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Overlay Source</Text>
          <Text style={[
            styles.debugText,
            { color: measurementResult.maskOverlayBase64 ? '#00FF00' : '#FF6B6B' }
          ]}>
            {measurementResult.maskOverlayBase64
              ? '✓ Server-generated overlay (Python/OpenCV)'
              : '✗ Client-generated overlay (fallback)'}
          </Text>
          <Text style={[
            styles.debugText,
            { color: measurementResult.croppedImageBase64 ? '#00FF00' : '#FF6B6B' }
          ]}>
            {measurementResult.croppedImageBase64
              ? '✓ Server-generated cropped image'
              : '✗ Local cropped image'}
          </Text>
        </View>

        {/* 감지된 영역 정보 (로컬 폴백 시에만 표시) */}
        {detectedRegions.length > 0 && (
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
        )}

        {/* 측정 결과 정보 */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Measurements (Stage 4)</Text>
          <Text style={styles.debugText}>Resolution: {measurementResult.imageWidth}x{measurementResult.imageHeight}</Text>
          {measurementResult.measurements.map((m) => (
            <Text key={m.finger} style={styles.debugText}>
              {m.finger}: {m.widthPixels}px → {m.widthMm}mm (conf: {(m.confidence * 100).toFixed(0)}%)
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
          {/* 크롭된 이미지 표시 (서버 생성 base64 → 로컬 파일 → 원본 순서) */}
          <Image
            source={{ uri: croppedImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          {/* 마스크 오버레이 (녹색 반투명) */}
          {renderMaskOverlay()}
          {/* 바운딩 박스 + 측정값 표시 - 공간이 좁아 제거 */}
          {/* {renderBoundingBoxOverlay()} */}
          {/* 감지된 영역 수 배지 */}
          {showOverlay && detectedRegionsCount > 0 && (
            <View style={styles.detectionBadge}>
              <Text style={styles.detectionBadgeText}>
                {detectedRegionsCount}개 손톱 감지
              </Text>
            </View>
          )}
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
  detectionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detectionBadgeText: {
    color: '#00FF00',
    fontSize: 14,
    fontWeight: 'bold',
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
