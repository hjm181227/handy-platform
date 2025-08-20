import React, { useState, useEffect } from 'react';
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

const { width, height } = Dimensions.get('window');

interface NailMeasurement {
  id: string;
  timestamp: string;
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
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [measuringStep, setMeasuringStep] = useState<'waiting' | 'measuring' | 'complete'>('waiting');
  const [selectedFinger, setSelectedFinger] = useState<string>('엄지');
  const [currentMeasurement, setCurrentMeasurement] = useState<{width: number; length: number} | null>(null);

  const fingers = ['엄지', '검지', '중지', '약지', '새끼'];

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const granted = await cameraService.requestCameraPermission();
        setHasPermission(granted);
      } catch (error) {
        console.error('권한 확인 실패:', error);
        setHasPermission(false);
      }
    };

    checkPermissions();
  }, []);

  const startMeasurement = () => {
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
  };

  const saveMeasurement = async () => {
    if (!currentMeasurement) return;

    try {
      const measurement: NailMeasurement = {
        id: `measurement_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fingerName: selectedFinger,
        width: currentMeasurement.width,
        length: currentMeasurement.length,
      };

      const existing = await AsyncStorage.getItem('nail_measurements');
      const measurements: NailMeasurement[] = existing ? JSON.parse(existing) : [];
      measurements.unshift(measurement); // 최신순으로 저장
      
      await AsyncStorage.setItem('nail_measurements', JSON.stringify(measurements));
      
      Alert.alert(
        '측정 완료! 📏',
        `${selectedFinger} 손가락 측정이 완료되었습니다.\n\n너비: ${currentMeasurement.width}mm\n길이: ${currentMeasurement.length}mm`,
        [
          {
            text: '계속 측정',
            onPress: () => {
              setMeasuringStep('waiting');
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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 카메라 시뮬레이션 배경 */}
      <View style={styles.cameraSimulation}>
        {measuringStep !== 'measuring' ? (
          <>
            <Text style={styles.simulationText}>📱 AR 네일 측정</Text>
            <Text style={styles.simulationSubtext}>손가락을 화면 중앙에 위치시킨 후 측정을 시작하세요</Text>
            <View style={styles.fingerIndicator}>
              <Text style={styles.fingerIcon}>✋</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.simulationText}>🔍 측정 중...</Text>
            <Text style={styles.simulationSubtext}>잠시만 기다려주세요</Text>
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
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
          {measuringStep === 'waiting' && (
            <>
              <Text style={styles.guideText}>손가락을 화면 중앙에 위치시켜 주세요</Text>
              <View style={styles.guideFrame}>
                <Text style={styles.guideFrameText}>📱 손가락을 여기에</Text>
              </View>
            </>
          )}

          {measuringStep === 'measuring' && (
            <>
              <Text style={styles.guideText}>측정 중...</Text>
              <View style={styles.guideFrame}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.guideFrameText}>스캔 중 📏</Text>
              </View>
            </>
          )}

          {measuringStep === 'complete' && currentMeasurement && (
            <>
              <Text style={styles.guideText}>측정 완료!</Text>
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>{selectedFinger} 손가락</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>너비:</Text>
                  <Text style={styles.resultValue}>{currentMeasurement.width}mm</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>길이:</Text>
                  <Text style={styles.resultValue}>{currentMeasurement.length}mm</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* 손가락 선택 */}
        {measuringStep === 'waiting' && (
          <View style={styles.fingerSelector}>
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
          {measuringStep === 'waiting' && (
            <TouchableOpacity
              style={[styles.measureButton, isLoading && styles.measureButtonDisabled]}
              onPress={startMeasurement}
              disabled={isLoading}
            >
              <Text style={styles.measureButtonText}>
                {isLoading ? '측정 중...' : '📏 측정 시작'}
              </Text>
            </TouchableOpacity>
          )}

          {measuringStep === 'complete' && (
            <View style={styles.completeButtons}>
              <TouchableOpacity
                style={[styles.measureButton, styles.retryButton]}
                onPress={() => {
                  setMeasuringStep('waiting');
                  setCurrentMeasurement(null);
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
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
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
  fingerSelector: {
    paddingHorizontal: 20,
    paddingVertical: 30,
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