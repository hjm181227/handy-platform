import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableReferenceLine from '../../components/DraggableReferenceLine';

const { width, height } = Dimensions.get('window');

interface MeasurementScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  imageUri: string;
  onComplete: () => void;
  onBack: () => void;
  onNavigateToSizes?: () => void;
}

interface NailMeasurement {
  id: string;
  timestamp: string;
  hand: 'left' | 'right';
  fingerName: string;
  width: number;
  length: number;
  imageUri?: string;
}

const MeasurementScreen: React.FC<MeasurementScreenProps> = ({
  selectedHand,
  selectedFinger,
  imageUri,
  onComplete,
  onBack,
  onNavigateToSizes,
}) => {
  const [referenceLines, setReferenceLines] = useState<{left: number; right: number} | null>(null);
  const [measurementResult, setMeasurementResult] = useState<number | null>(null);

  // 신용카드 표준 크기: 85.60mm (가로)
  const CARD_WIDTH_MM = 85.60;

  const handleLinePositionChange = (position: number, side: 'left' | 'right') => {
    setReferenceLines(prev => ({
      left: side === 'left' ? position : prev?.left ?? width * 0.3,
      right: side === 'right' ? position : prev?.right ?? width * 0.7,
    }));
  };

  const calculateMeasurement = () => {
    if (!referenceLines) {
      Alert.alert('오류', '기준선을 설정해주세요.');
      return;
    }

    if (!referenceLines.left || !referenceLines.right) {
      Alert.alert('오류', '모든 기준선을 올바르게 설정해주세요.');
      return;
    }

    // 픽셀 거리 계산
    const nailPixelDistance = Math.abs(referenceLines.right - referenceLines.left);
    
    // 기준선이 너무 가까우면 측정 불가
    if (nailPixelDistance < 20) {
      Alert.alert('오류', '기준선이 너무 가깝습니다. 손톱의 양끝에 맞춰주세요.');
      return;
    }
    
    // 임시 계산 (실제로는 이미지에서 카드 크기를 감지해야 함)
    // 현재는 화면 비율을 기준으로 근사치 계산
    const estimatedCardPixelWidth = width * 0.4; // 추정 카드 픽셀 크기
    const pixelsPerMm = estimatedCardPixelWidth / CARD_WIDTH_MM;
    
    // 손톱 실제 크기 계산 (소수점 첫째 자리까지)
    const nailWidthMm = Math.round((nailPixelDistance / pixelsPerMm) * 10) / 10;
    
    // 일반적인 손톱 크기 범위 검증 (3-20mm)
    if (nailWidthMm < 3 || nailWidthMm > 20) {
      Alert.alert(
        '측정값 확인',
        `측정된 손톱 크기가 ${nailWidthMm}mm입니다. 일반적인 범위(3-20mm)를 벗어납니다. 기준선을 다시 확인해주세요.`,
        [
          { text: '다시 설정', style: 'cancel' },
          { text: '이대로 저장', onPress: () => setMeasurementResult(nailWidthMm) }
        ]
      );
      return;
    }
    
    setMeasurementResult(nailWidthMm);
  };

  const saveMeasurement = async () => {
    if (!measurementResult) return;

    try {
      const measurement: NailMeasurement = {
        id: `measurement_${Date.now()}`,
        timestamp: new Date().toISOString(),
        hand: selectedHand,
        fingerName: selectedFinger,
        width: measurementResult,
        length: 0, // 현재는 가로 길이만 측정
        imageUri,
      };

      const existing = await AsyncStorage.getItem('nail_measurements');
      const measurements: NailMeasurement[] = existing ? JSON.parse(existing) : [];
      measurements.unshift(measurement); // 최신순으로 저장
      
      await AsyncStorage.setItem('nail_measurements', JSON.stringify(measurements));
      
      Alert.alert(
        '측정 완료! 📏',
        `${selectedHand === 'left' ? '왼손' : '오른손'} ${selectedFinger} 손가락 측정이 완료되었습니다.\n\n너비: ${measurementResult}mm`,
        [
          {
            text: '계속 측정',
            onPress: onComplete,
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
      
      {/* 촬영된 이미지 배경 */}
      <ImageBackground source={{ uri: imageUri }} style={styles.imageBackground} resizeMode="contain">
        {/* 기준선들 */}
        <View style={styles.referenceLineContainer}>
          <DraggableReferenceLine
            initialPosition={width * 0.3}
            lineColor="#FF6B6B"
            label="L"
            onPositionChange={(position) => handleLinePositionChange(position, 'left')}
            containerWidth={width * 0.8}
          />
          <DraggableReferenceLine
            initialPosition={width * 0.7}
            lineColor="#FF6B6B"
            label="R"
            onPositionChange={(position) => handleLinePositionChange(position, 'right')}
            containerWidth={width * 0.8}
          />
        </View>
      </ImageBackground>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>손톱 크기 측정</Text>
      </View>

      {/* 안내 텍스트 */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>
          {selectedHand === 'left' ? '왼손' : '오른손'} {selectedFinger} 손가락
        </Text>
        <Text style={styles.instructionText}>
          빨간색 기준선을 손톱의 양끝에 맞춰주세요
        </Text>
        {measurementResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>측정 결과: {measurementResult}mm</Text>
          </View>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        {!measurementResult ? (
          <TouchableOpacity
            style={styles.measureButton}
            onPress={calculateMeasurement}
          >
            <Text style={styles.buttonText}>📏 측정하기</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completeButtons}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={() => setMeasurementResult(null)}
            >
              <Text style={styles.buttonText}>다시 측정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveMeasurement}
            >
              <Text style={styles.buttonText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  referenceLineContainer: {
    position: 'absolute',
    top: 100,
    left: width * 0.1,
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    marginRight: 40,
  },
  instructionContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 20,
    zIndex: 15,
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
  resultContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 10,
  },
  resultText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingBottom: 40,
    zIndex: 20,
  },
  measureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  completeButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MeasurementScreen;