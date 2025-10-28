import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import CameraGuideOverlay from '../../components/CameraGuideOverlay';
import { cameraService } from '../../services/cameraService';

interface CameraScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  onPhotoTaken: (imageUri: string) => void;
  onBack: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({
  selectedHand,
  selectedFinger,
  onPhotoTaken,
  onBack,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTakePhoto = async () => {
    setIsLoading(true);
    
    try {
      const result = await cameraService.takePhoto();
      if (result?.uri) {
        onPhotoTaken(result.uri);
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      Alert.alert(
        '촬영 실패',
        '사진 촬영에 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 카메라 미리보기 대체 화면 */}
      <View style={styles.cameraPreview}>
        <Text style={styles.previewText}>📷</Text>
        <Text style={styles.instructionText}>
          {selectedHand === 'left' ? '왼손' : '오른손'} {selectedFinger}을 신용카드와 함께 촬영해주세요
        </Text>
      </View>

      {/* 카메라 가이드 오버레이 */}
      <CameraGuideOverlay visible={true} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>네일 사이즈 측정</Text>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.button, styles.backActionButton]}
          onPress={onBack}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>뒤로</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.captureButton, isLoading && styles.buttonDisabled]}
          onPress={handleTakePhoto}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '📷 촬영 중...' : '📸 촬영'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingBottom: 40,
    gap: 15,
    zIndex: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  backActionButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  previewText: {
    fontSize: 80,
    marginBottom: 20,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
});

export default CameraScreen;