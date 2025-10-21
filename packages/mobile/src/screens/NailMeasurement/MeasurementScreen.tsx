import React, { useState, useEffect } from 'react';
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
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { requestCameraPermission } from '../../utils/permissions';
import { userService } from '../../services/apiService';
import { koreanToEnglishFinger } from '@handy-platform/shared/src/utils/fingerMapping';

const { width, height } = Dimensions.get('window');

interface MeasurementScreenProps {
  selectedHand: 'left' | 'right';
  selectedFinger: string;
  imageUri: string;
  onComplete: () => void;
  onBack: () => void;
  onNavigateToSizes?: () => void;
}


interface ImageContainer {
  width: number;
  height: number;
  x: number;
  y: number;
}

const MeasurementScreen: React.FC<MeasurementScreenProps> = ({
  selectedHand,
  selectedFinger,
  imageUri,
  onComplete,
  onBack,
  onNavigateToSizes,
}) => {
  // Replace points with vertical lines
  const [leftLineX, setLeftLineX] = useState(width * 0.3);
  const [rightLineX, setRightLineX] = useState(width * 0.7);
  const [scale, setScale] = useState<number | null>(null);
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);
  const [measurementResult, setMeasurementResult] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isLinesVisible, setIsLinesVisible] = useState(false);
  const [imageContainer, setImageContainer] = useState<ImageContainer>({ width: 0, height: 0, x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // 이미지 로드 시 크기 정보 가져오기
  const onImageLoad = (event: any) => {
    console.log('Image load event:', event);
    const { width, height } = event.nativeEvent.source;
    setImageWidth(width);
    setImageHeight(height);
    setScale(428/300);
    console.log('Image Width:', width);
    console.log('Image Height:', height);
  };

  useEffect(() => {
    console.log('Updated Image Height:', imageHeight);
  }, [imageHeight]);

  // 이미지 크롭 처리 with runtime permission
  const handleCropImage = async () => {
    // Request camera permission at runtime
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('권한 필요', '이미지 크롭을 위해 카메라 권한이 필요합니다.');
      return;
    }

    try {
      const result = await ImagePicker.openCropper({
        mediaType: 'photo',
        path: imageUri,
        width: 428,
        height: 269.9,
        cropperToolbarTitle: '카드 크기에 맞춰 크롭해주세요',
        includeBase64: false,
        compressImageQuality: 0.8,
      });
      
      setCroppedImageUri(result.path);
      // 크롭된 이미지의 실제 크기를 기반으로 스케일 계산
      const imageScale = 85.6 / result.width; // 신용카드 표준 크기 85.6mm
      setScale(imageScale);

      Alert.alert('크롭 완료', '이제 빨간색 기준선을 손톱의 양끝에 맞춰주세요.');
    } catch (error) {
      console.error('Image crop failed:', error);
      Alert.alert('오류', '이미지 크롭에 실패했습니다.');
    }
  };

  // Calculate image container dimensions based on cropped image
  const calculateImageContainer = (containerWidth: number, containerHeight: number) => {
    if (!croppedImageUri) return;

    // Credit card aspect ratio: 85.6mm x 53.98mm ≈ 1.58
    const aspectRatio = 428 / 269.9; // From crop dimensions

    let imageWidth = containerWidth;
    let imageHeight = containerWidth / aspectRatio;

    if (imageHeight > containerHeight) {
      imageHeight = containerHeight;
      imageWidth = containerHeight * aspectRatio;
    }

    const x = (containerWidth - imageWidth) / 2;
    const y = (containerHeight - imageHeight) / 2;

    setImageContainer({ width: imageWidth, height: imageHeight, x, y });

    // 기준선 위치 초기화 (이미지 컨테이너 중심 기준)
    setLeftLineX(x + imageWidth * 0.3);
    setRightLineX(x + imageWidth * 0.7);

    // 이미지 컨테이너 계산 완료 후 기준선 표시
    setIsLinesVisible(true);
  };

  // croppedImageUri 변경 시 자동으로 이미지 컨테이너 재계산
  useEffect(() => {
    if (croppedImageUri && containerSize.width > 0 && containerSize.height > 0) {
      calculateImageContainer(containerSize.width, containerSize.height);
    }
  }, [croppedImageUri, containerSize.width, containerSize.height]);

  // 각 기준선에 대한 PanResponder 생성
  const createLinePanResponder = (lineType: 'left' | 'right') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragIndex(lineType === 'left' ? 0 : 1);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX } = gestureState;
        const constrainedX = Math.max(
          imageContainer.x + 15,
          Math.min(imageContainer.x + imageContainer.width - 15, moveX)
        );
        
        if (lineType === 'left') {
          setLeftLineX(constrainedX);
        } else {
          setRightLineX(constrainedX);
        }
      },
      onPanResponderRelease: () => {
        setDragIndex(null);
      },
    });
  };

  const leftLinePanResponder = createLinePanResponder('left');
  const rightLinePanResponder = createLinePanResponder('right');

  const calculateDistance = () => {
    if (!scale) return null;
    const pixelDistance = Math.abs(rightLineX - leftLineX);
    const distanceInMm = (pixelDistance * 0.178 * scale).toFixed(2);
    const result = Math.ceil(parseFloat(distanceInMm));
    console.log(distanceInMm);

    setMeasurementResult(result);
    return result;
  };

  const saveMeasurement = async () => {
    if (!measurementResult) return;

    try {
      setIsSaving(true);

      // 한글 손가락 이름을 영어로 변환
      const fingerEnglish = koreanToEnglishFinger(selectedFinger);

      // 서버에 저장
      const response = await userService.updateNailSize(
        selectedHand,
        fingerEnglish,
        measurementResult
      );

      if (response.success) {
        Alert.alert(
          '측정 완료! 📏',
          `${selectedHand === 'left' ? '왼손' : '오른손'} ${selectedFinger} 손가락 측정이 완료되었습니다.\n\n너비: ${measurementResult}mm`,
          [
            {
              text: '확인',
              onPress: () => {
                // 성공 시 측정 기록 화면으로 이동
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
        throw new Error(response.error || '측정값 저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('측정값 저장 실패:', error);
      Alert.alert(
        '저장 실패',
        error.message || '측정값 저장에 실패했습니다. 다시 시도해주세요.',
        [
          { text: '확인', style: 'default' }
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 촬영된 이미지 배경 */}
      <ImageBackground
        source={{ uri: croppedImageUri || imageUri }}
        style={styles.imageBackground}
        resizeMode="contain"
        onLoad={onImageLoad}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
      >
        {/* 세로 기준선 오버레이 */}
        {isLinesVisible && imageContainer.width > 0 && (
          <View style={[
            styles.measurementContainer, 
            {
              left: imageContainer.x,
              top: imageContainer.y,
              width: imageContainer.width,
              height: imageContainer.height,
            }
          ]}>
            {/* 왼쪽 기준선 */}
            <View 
              style={[
                styles.verticalLine,
                {
                  left: leftLineX - imageContainer.x,
                }
              ]}
            />
            
            {/* 오른쪽 기준선 */}
            <View 
              style={[
                styles.verticalLine,
                {
                  left: rightLineX - imageContainer.x,
                }
              ]}
            />
            
            {/* 왼쪽 드래그 핸들 */}
            <View
              style={[
                styles.dragHandle,
                {
                  left: leftLineX - imageContainer.x - 15,
                  top: 10,
                  backgroundColor: dragIndex === 0 ? '#FF8E8E' : '#FF6B6B',
                }
              ]}
              {...leftLinePanResponder.panHandlers}
            >
              <Text style={styles.handleLabel}>L</Text>
            </View>
            
            {/* 오른쪽 드래그 핸들 */}
            <View
              style={[
                styles.dragHandle,
                {
                  left: rightLineX - imageContainer.x - 15,
                  top: 10,
                  backgroundColor: dragIndex === 1 ? '#FF8E8E' : '#FF6B6B',
                }
              ]}
              {...rightLinePanResponder.panHandlers}
            >
              <Text style={styles.handleLabel}>R</Text>
            </View>
          </View>
        )}
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
        {!croppedImageUri ? (
          <Text style={styles.instructionText}>
            먼저 신용카드와 함께 촬영된 이미지를 크롭해주세요
          </Text>
        ) : (
          <Text style={styles.instructionText}>
            빨간색 기준선을 손톱의 양끝에 맞춰주세요
          </Text>
        )}
        {measurementResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>측정 결과: {measurementResult}mm</Text>
          </View>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        {!croppedImageUri ? (
          <TouchableOpacity
            style={styles.measureButton}
            onPress={handleCropImage}
          >
            <Text style={styles.buttonText}>✂️ 이미지 크롭하기</Text>
          </TouchableOpacity>
        ) : !measurementResult ? (
          <TouchableOpacity
            style={styles.measureButton}
            onPress={calculateDistance}
          >
            <Text style={styles.buttonText}>📏 측정하기</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completeButtons}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={() => {
                setMeasurementResult(null);
                setLeftLineX(imageContainer.x + imageContainer.width * 0.3);
                setRightLineX(imageContainer.x + imageContainer.width * 0.7);
              }}
            >
              <Text style={styles.buttonText}>다시 측정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveMeasurement}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>저장하기</Text>
              )}
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
  measurementContainer: {
    position: 'absolute',
    zIndex: 50,
    elevation: 50,
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#FF6B6B',
    opacity: 0.8,
  },
  dragHandle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
  },
  handleLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
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
    zIndex: 30, // 기준선보다 낮은 zIndex
    elevation: 30,
    pointerEvents: 'none', // 터치 이벤트 통과
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