import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cameraService } from '../services/cameraService';
import DraggableReferenceLine from '../components/DraggableReferenceLine';
import CameraGuideOverlay from '../components/CameraGuideOverlay';

const { width, height } = Dimensions.get('window');

interface NailMeasurement {
  id: string;
  timestamp: string;
  hand: 'left' | 'right';
  fingerName: string;
  width: number; // mm
  length: number; // mm
  imageUri?: string;
}

interface ARCameraScreenProps {
  onClose?: () => void;
  onNavigateToSizes?: () => void;
}

const ARCameraScreen: React.FC<ARCameraScreenProps> = ({ onClose, onNavigateToSizes }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [measuringStep, setMeasuringStep] = useState<'guide' | 'camera' | 'card_calibration' | 'nail_measurement' | 'result'>('guide');
  const [selectedFinger, setSelectedFinger] = useState<string>('엄지');
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
  const [currentMeasurement, setCurrentMeasurement] = useState<{width: number; length: number} | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cardReferenceLines, setCardReferenceLines] = useState<{left: number; right: number} | null>(null);
  const [nailReferenceLines, setNailReferenceLines] = useState<{left: number; right: number} | null>(null);

  const fingers = ['엄지', '검지', '중지', '약지', '새끼'];

  const startMeasurement = async () => {
    try {
      // 권한 요청 (사용자가 실제로 측정하려는 시점에)
      const granted = await cameraService.requestCameraPermission();

      if (!granted) {
        Alert.alert(
          '카메라 권한 필요',
          '손톱 크기를 AR로 정확히 측정하려면 카메라 접근 권한이 필요합니다.\n\n설정에서 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => {
                import('react-native').then(({ Linking }) => {
                  Linking.openSettings();
                });
              },
            },
          ]
        );
        return;
      }

      // 권한 허용됨 - 측정 시작
      setMeasuringStep('measuring');
      setIsLoading(true);

      // AR 측정 시뮬레이션 (실제로는 ML Kit이나 ARCore/ARKit 사용)
      setTimeout(() => {
        // 실제 측정값 시뮬레이션
        const width = Math.round((Math.random() * 5 + 8) * 10) / 10; // 8.0-13.0mm
        const length = Math.round((Math.random() * 8 + 15) * 10) / 10; // 15.0-23.0mm

        setCurrentMeasurement({ width, length });
        setMeasuringStep('complete');
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error('측정 시작 실패:', error);
      Alert.alert('오류', '측정을 시작할 수 없습니다.');
      setIsLoading(false);
    }
  const simulateCameraCapture = async () => {
    setIsLoading(true);

    try {
      // 실제 카메라 촬영
      const result = await cameraService.takePhoto({
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
        includeBase64: false,
      });

      setCapturedImage(result.uri);
      setMeasuringStep('card_calibration');
    } catch (error) {
      console.error('Camera capture failed:', error);
      Alert.alert(
        '촬영 실패',
        '사진 촬영에 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인', onPress: () => setMeasuringStep('camera') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNailSize = () => {
    if (!cardReferenceLines || !nailReferenceLines) {
      Alert.alert('오류', '기준선을 설정해주세요.');
      return;
    }

    if (!cardReferenceLines.left || !cardReferenceLines.right ||
        !nailReferenceLines.left || !nailReferenceLines.right) {
      Alert.alert('오류', '모든 기준선을 올바르게 설정해주세요.');
      return;
    }

    // 신용카드 표준 크기: 85.60mm (가로)
    const CARD_WIDTH_MM = 85.60;

    // 픽셀 거리 계산
    const cardPixelDistance = Math.abs(cardReferenceLines.right - cardReferenceLines.left);
    const nailPixelDistance = Math.abs(nailReferenceLines.right - nailReferenceLines.left);

    // 기준선이 너무 가까우면 측정 불가
    if (cardPixelDistance < 50) {
      Alert.alert('오류', '카드 기준선이 너무 가깝습니다. 카드의 양끝에 맞춰주세요.');
      return;
    }

    if (nailPixelDistance < 10) {
      Alert.alert('오류', '손톱 기준선이 너무 가깝습니다. 손톱의 양끝에 맞춰주세요.');
      return;
    }

    // mm당 픽셀 비율 계산
    const pixelsPerMm = cardPixelDistance / CARD_WIDTH_MM;

    // 손톱 실제 크기 계산 (소수점 첫째 자리까지)
    const nailWidthMm = Math.round((nailPixelDistance / pixelsPerMm) * 10) / 10;

    // 일반적인 손톱 크기 범위 검증 (3-20mm)
    if (nailWidthMm < 3 || nailWidthMm > 20) {
      Alert.alert(
        '측정값 확인',
        `측정된 손톱 크기가 ${nailWidthMm}mm입니다. 일반적인 범위(3-20mm)를 벗어납니다. 기준선을 다시 확인해주세요.`,
        [
          { text: '다시 설정', style: 'cancel' },
          { text: '이대로 저장', onPress: () => {
            setCurrentMeasurement({ width: nailWidthMm, length: 0 });
            setMeasuringStep('result');
          }}
        ]
      );
      return;
    }

    setCurrentMeasurement({
      width: nailWidthMm,
      length: 0 // 현재는 가로 길이만 측정
    });
    setMeasuringStep('result');
  };

  const saveMeasurement = async () => {
    if (!currentMeasurement) return;

    try {
      const measurement: NailMeasurement = {
        id: `measurement_${Date.now()}`,
        timestamp: new Date().toISOString(),
        hand: selectedHand,
        fingerName: selectedFinger,
        width: currentMeasurement.width,
        length: currentMeasurement.length,
        imageUri: capturedImage || undefined,
      };

      const existing = await AsyncStorage.getItem('nail_measurements');
      const measurements: NailMeasurement[] = existing ? JSON.parse(existing) : [];
      measurements.unshift(measurement); // 최신순으로 저장

      await AsyncStorage.setItem('nail_measurements', JSON.stringify(measurements));

      Alert.alert(
        '측정 완료! 📏',
        `${selectedHand === 'left' ? '왼손' : '오른손'} ${selectedFinger} 손가락 측정이 완료되었습니다.\n\n너비: ${currentMeasurement.width}mm\n길이: ${currentMeasurement.length}mm`,
        [
          {
            text: '계속 측정',
            onPress: () => {
              setMeasuringStep('guide');
              setCurrentMeasurement(null);
            },
          },
          {
            text: '측정 기록 보기',
            onPress: onNavigateToSizes,
          },
        ]
      );
    } catch (error) {
      console.error('측정값 저장 실패:', error);
      Alert.alert('오류', '측정값 저장에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 카메라 시뮬레이션 배경 */}
      <View style={styles.cameraSimulation}>
        {measuringStep === 'guide' && (
          <>
            <Text style={styles.simulationText}>📱 네일 사이즈 측정</Text>
          </>
        )}

        {measuringStep === 'camera' && (
          <>
            <Text style={styles.simulationText}>📷 사진 촬영</Text>
            <Text style={styles.simulationSubtext}>신용카드와 측정할 손가락을 함께 촬영해주세요</Text>
            <View style={styles.fingerIndicator}>
              <Text style={styles.fingerIcon}>📸</Text>
            </View>
            {/* 카메라 가이드 오버레이 */}
            <CameraGuideOverlay visible={true} />
          </>
        )}

        {(measuringStep === 'card_calibration' || measuringStep === 'nail_measurement') && capturedImage && (
          <ImageBackground source={{ uri: capturedImage }} style={styles.capturedImageBackground} resizeMode="contain">
            <Text style={styles.simulationText}>
              {measuringStep === 'card_calibration' ? '💳 카드 기준선 설정' : '💅 손톱 기준선 설정'}
            </Text>

            {/* 카드 기준선 */}
            {measuringStep === 'card_calibration' && (
              <View style={styles.referenceLineContainer}>
                <DraggableReferenceLine
                  initialPosition={width * 0.25}
                  lineColor="#FFD700"
                  label="L"
                  onPositionChange={(position) => {
                    setCardReferenceLines(prev => ({
                      left: position,
                      right: prev?.right ?? width * 0.65
                    }));
                  }}
                  containerWidth={width * 0.8}
                />
                <DraggableReferenceLine
                  initialPosition={width * 0.65}
                  lineColor="#FFD700"
                  label="R"
                  onPositionChange={(position) => {
                    setCardReferenceLines(prev => ({
                      left: prev?.left ?? width * 0.25,
                      right: position
                    }));
                  }}
                  containerWidth={width * 0.8}
                />
              </View>
            )}

            {/* 손톱 기준선 */}
            {measuringStep === 'nail_measurement' && (
              <View style={styles.referenceLineContainer}>
                <DraggableReferenceLine
                  initialPosition={width * 0.4}
                  lineColor="#FF6B6B"
                  label="L"
                  onPositionChange={(position) => {
                    setNailReferenceLines(prev => ({
                      left: position,
                      right: prev?.right ?? width * 0.5
                    }));
                  }}
                  containerWidth={width * 0.8}
                />
                <DraggableReferenceLine
                  initialPosition={width * 0.5}
                  lineColor="#FF6B6B"
                  label="R"
                  onPositionChange={(position) => {
                    setNailReferenceLines(prev => ({
                      left: prev?.left ?? width * 0.4,
                      right: position
                    }));
                  }}
                  containerWidth={width * 0.8}
                />
              </View>
            )}
          </ImageBackground>
        )}

        {measuringStep === 'result' && (
          <>
            <Text style={styles.simulationText}>✅ 측정 완료</Text>
            <Text style={styles.simulationSubtext}>네일 사이즈가 성공적으로 측정되었습니다</Text>
            <View style={styles.fingerIndicator}>
              <Text style={styles.fingerIcon}>📏</Text>
            </View>
          </>
        )}
      </View>

      {/* 오버레이 UI */}
      <View style={styles.overlay}>
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>네일 사이즈 측정</Text>
        </View>

        {/* 가이드 영역 */}
        <View style={styles.guideContainer}>
          {/* guide 단계에서는 가이드 텍스트 제거 - 선택 UI와 겹치는 문제 해결 */}

          {measuringStep === 'camera' && (
            <>
              <Text style={styles.guideText}>카메라를 위치시켜 주세요</Text>
            </>
          )}

          {measuringStep === 'card_calibration' && (
            <>
              <Text style={styles.guideText}>카드 양끝에 기준선을 맞춰주세요</Text>
              <Text style={styles.guideSubtext}>신용카드의 가로 길이를 기준으로 측정합니다 (85.6mm)</Text>
            </>
          )}

          {measuringStep === 'nail_measurement' && (
            <>
              <Text style={styles.guideText}>손톱 양끝에 기준선을 맞춰주세요</Text>
              <Text style={styles.guideSubtext}>정확한 측정을 위해 손톱의 가장 넓은 부분에 맞춰주세요</Text>
            </>
          )}

          {measuringStep === 'result' && currentMeasurement && (
            <>
              <Text style={styles.guideText}>측정 완료!</Text>
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>
                  {selectedHand === 'left' ? '왼손' : '오른손'} {selectedFinger} 손가락
                </Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>너비:</Text>
                  <Text style={styles.resultValue}>{currentMeasurement.width}mm</Text>
                </View>
                <Text style={styles.resultNote}>
                  * 신용카드 기준 측정 (85.6mm)
                </Text>
                <Text style={styles.resultNote}>
                  측정 시간: {new Date().toLocaleTimeString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* 손과 손가락 선택 */}
        {measuringStep === 'guide' && (
          <View style={styles.selectionContainer}>
            {/* 손 선택 */}
            <View style={styles.handSelector}>
              <Text style={styles.selectorTitle}>측정할 손을 선택하세요</Text>
              <View style={styles.handButtons}>
                <TouchableOpacity
                  style={[
                    styles.handButton,
                    selectedHand === 'left' && styles.handButtonActive,
                  ]}
                  onPress={() => setSelectedHand('left')}
                >
                  <Text
                    style={[
                      styles.handButtonText,
                      selectedHand === 'left' && styles.handButtonTextActive,
                    ]}
                  >
                    🤚 왼손
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.handButton,
                    selectedHand === 'right' && styles.handButtonActive,
                  ]}
                  onPress={() => setSelectedHand('right')}
                >
                  <Text
                    style={[
                      styles.handButtonText,
                      selectedHand === 'right' && styles.handButtonTextActive,
                    ]}
                  >
                    ✋ 오른손
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 손가락 선택 */}
            <Text style={styles.selectorTitle}>측정할 손가락을 선택하세요</Text>
            <View style={styles.fingerButtons}>
              {fingers.map((finger) => (
                <TouchableOpacity
                  key={finger}
                  style={[
                    styles.fingerButton,
                    selectedFinger === finger && styles.fingerButtonActive,
                  ]}
                  onPress={() => setSelectedFinger(finger)}
                >
                  <Text
                    style={[
                      styles.fingerButtonText,
                      selectedFinger === finger && styles.fingerButtonTextActive,
                    ]}
                  >
                    {finger}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 하단 버튼 */}
        <View style={styles.bottomButtons}>
          {measuringStep === 'guide' && (
            <TouchableOpacity
              style={[styles.measureButton, isLoading && styles.measureButtonDisabled]}
              onPress={() => setMeasuringStep('camera')}
              disabled={isLoading}
            >
              <Text style={styles.measureButtonText}>📷 촬영 시작</Text>
            </TouchableOpacity>
          )}

          {measuringStep === 'camera' && (
            <View style={styles.completeButtons}>
              <TouchableOpacity
                style={[styles.measureButton, styles.retryButton]}
                onPress={() => setMeasuringStep('guide')}
                disabled={isLoading}
              >
                <Text style={styles.measureButtonText}>뒤로</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.measureButton, isLoading && styles.measureButtonDisabled]}
                onPress={simulateCameraCapture}
                disabled={isLoading}
              >
                <Text style={styles.measureButtonText}>
                  {isLoading ? '📷 촬영 중...' : '📸 촬영'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {measuringStep === 'card_calibration' && (
            <TouchableOpacity
              style={styles.measureButton}
              onPress={() => setMeasuringStep('nail_measurement')}
            >
              <Text style={styles.measureButtonText}>다음 단계</Text>
            </TouchableOpacity>
          )}

          {measuringStep === 'nail_measurement' && (
            <View style={styles.completeButtons}>
              <TouchableOpacity
                style={[styles.measureButton, styles.retryButton]}
                onPress={() => setMeasuringStep('card_calibration')}
              >
                <Text style={styles.measureButtonText}>이전 단계</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.measureButton}
                onPress={calculateNailSize}
              >
                <Text style={styles.measureButtonText}>측정 완료</Text>
              </TouchableOpacity>
            </View>
          )}

          {measuringStep === 'result' && (
            <View style={styles.completeButtons}>
              <TouchableOpacity
                style={[styles.measureButton, styles.retryButton]}
                onPress={() => {
                  setMeasuringStep('guide');
                  setCurrentMeasurement(null);
                  setCapturedImage(null);
                  setCardReferenceLines(null);
                  setNailReferenceLines(null);
                  // 손과 손가락 선택은 유지 (사용자 편의를 위해)
                }}
              >
                <Text style={styles.measureButtonText}>다시 측정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.measureButton}
                onPress={saveMeasurement}
              >
                <Text style={styles.measureButtonText}>저장하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraSimulation: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  simulationText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  simulationSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fingerIndicator: {
    marginTop: 40,
    alignItems: 'center',
  },
  fingerIcon: {
    fontSize: 100,
    opacity: 0.6,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 40, // backButton과 균형 맞추기
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guideText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  guideFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 20,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  guideFrameText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  guideSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  capturedImageBackground: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  referenceLineContainer: {
    position: 'absolute',
    top: 100,
    left: width * 0.1,
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: 'transparent',
  },
  resultContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: 150,
  },
  resultLabel: {
    color: '#CCC',
    fontSize: 18,
    flex: 1,
  },
  resultValue: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  resultNote: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: 20,
  },
  fingerSelector: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
  },
  handSelector: {
    marginBottom: 30,
  },
  handButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  handButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 100,
  },
  handButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  handButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  handButtonTextActive: {
    fontWeight: 'bold',
  },
  selectorTitle: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  fingerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  fingerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 60,
  },
  fingerButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  fingerButtonText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  fingerButtonTextActive: {
    fontWeight: 'bold',
  },
  bottomButtons: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  measureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  measureButtonDisabled: {
    backgroundColor: '#666',
  },
  measureButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completeButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ARCameraScreen;
