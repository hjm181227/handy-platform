import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import CameraGuideOverlay from '../../components/CameraGuideOverlay';
import { NMColors } from '../../styles/nailMeasurementTheme';

interface CameraScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  isThumbOnly: boolean;
  onPhotoTaken: (imageUri: string) => void;
  onBack: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({
  selectedHand,
  selectedFinger,
  isThumbOnly,
  onPhotoTaken,
  onBack,
}) => {
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handText = selectedHand === 'left' ? '왼손' : '오른손';
  const fingerText = isThumbOnly ? '엄지' : '4개 손가락';
  const headerTitle = `${handText} ${fingerText} 촬영`;

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
      });

      const photoUri = `file://${photo.path}`;
      console.log('[CameraScreen] Photo taken:', photoUri);
      onPhotoTaken(photoUri);
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert(
        '촬영 실패',
        '사진 촬영에 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // 권한 없음
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            카메라 권한이 필요합니다
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>권한 허용</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={onBack}>
            <Text style={styles.backLinkText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 카메라 장치 없음
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            카메라를 찾을 수 없습니다
          </Text>
          <TouchableOpacity style={styles.backLink} onPress={onBack}>
            <Text style={styles.backLinkText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 실시간 카메라 미리보기 */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        onInitialized={() => setIsCameraReady(true)}
      />

      {/* 카메라 가이드 오버레이 */}
      <CameraGuideOverlay
        visible={true}
        isThumbOnly={isThumbOnly}
        selectedHand={selectedHand}
      />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color={NMColors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* 안내 섹션 */}
      <View style={styles.instructionSection}>
        <Text style={styles.instructionTitle}>
          {isThumbOnly
            ? '신용카드 위에 엄지를 올려주세요'
            : '신용카드 위에 4개 손가락을 올려주세요'
          }
        </Text>
        <Text style={styles.instructionSubtitle}>
          {isThumbOnly
            ? '손톱이 정면을 향하도록 기울이지 마세요'
            : '검지, 중지, 약지, 소지를 나란히 펴서 촬영해주세요'
          }
        </Text>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={onBack}
          disabled={isCapturing}
        >
          <Text style={styles.backActionText}>뒤로</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.captureButton,
            (!isCameraReady || isCapturing) && styles.buttonDisabled,
          ]}
          onPress={handleTakePhoto}
          disabled={!isCameraReady || isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color={NMColors.white} />
          ) : (
            <>
              <Icon name="camera" size={20} color={NMColors.white} />
              <Text style={styles.captureText}>촬영</Text>
            </>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NMColors.whiteSemiTranslucent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: NMColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 40,
  },
  instructionSection: {
    position: 'absolute',
    top: 110,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  instructionTitle: {
    color: NMColors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionSubtitle: {
    color: NMColors.whiteTranslucent,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 16,
    gap: 12,
    zIndex: 20,
  },
  backActionButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: NMColors.whiteSemiTranslucent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backActionText: {
    color: NMColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: NMColors.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureText: {
    color: NMColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: NMColors.white,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: NMColors.purple,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
  },
  permissionButtonText: {
    color: NMColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    padding: 10,
  },
  backLinkText: {
    color: '#888',
    fontSize: 14,
  },
});

export default CameraScreen;
