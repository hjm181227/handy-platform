import React, { useState, useEffect } from 'react';
import { cameraService } from '../../services/cameraService';
import SelectionScreen from './SelectionScreen';
import CameraScreen from './CameraScreen';
import MeasurementScreen from './MeasurementScreen';

type MeasurementStep = 'selection' | 'camera' | 'measurement';

interface NailMeasurementProps {
  onClose?: () => void;
  onNavigateToSizes?: () => void;
  preselectedHand?: 'left' | 'right';
  preselectedFinger?: string;
}

const NailMeasurement: React.FC<NailMeasurementProps> = ({
  onClose,
  onNavigateToSizes,
  preselectedHand,
  preselectedFinger
}) => {
  const [currentStep, setCurrentStep] = useState<MeasurementStep>('selection');
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>(preselectedHand || 'right');
  const [selectedFinger, setSelectedFinger] = useState<string>(preselectedFinger || '엄지');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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

  const handleStartCamera = () => {
    setCurrentStep('camera');
  };

  const handlePhotoTaken = (imageUri: string) => {
    setCapturedImage(imageUri);
    setCurrentStep('measurement');
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setCapturedImage(null);
  };

  const handleBackToCamera = () => {
    setCurrentStep('camera');
  };

  const handleMeasurementComplete = () => {
    // 측정 완료 후 처음으로 돌아가기
    setCurrentStep('selection');
    setCapturedImage(null);
    // 선택한 손과 손가락은 유지 (사용자 편의)
  };

  // 권한 확인 중이거나 권한이 없는 경우 selection 화면 표시
  if (hasPermission === null || hasPermission === false) {
    return (
      <SelectionScreen
        selectedHand={selectedHand}
        selectedFinger={selectedFinger}
        onHandSelect={setSelectedHand}
        onFingerSelect={setSelectedFinger}
        onStartCamera={() => {
          if (hasPermission === false) {
            // 권한 재요청
            cameraService.requestCameraPermission().then(setHasPermission);
          } else {
            // 권한이 있으면 카메라로 이동
            handleStartCamera();
          }
        }}
        onClose={onClose || (() => {})}
      />
    );
  }

  // 단계별 화면 렌더링
  switch (currentStep) {
    case 'selection':
      return (
        <SelectionScreen
          selectedHand={selectedHand}
          selectedFinger={selectedFinger}
          onHandSelect={setSelectedHand}
          onFingerSelect={setSelectedFinger}
          onStartCamera={handleStartCamera}
          onClose={onClose || (() => {})}
        />
      );

    case 'camera':
      return (
        <CameraScreen
          selectedHand={selectedHand}
          selectedFinger={selectedFinger}
          onPhotoTaken={handlePhotoTaken}
          onBack={handleBackToSelection}
        />
      );

    case 'measurement':
      return (
        <MeasurementScreen
          selectedHand={selectedHand}
          selectedFinger={selectedFinger}
          imageUri={capturedImage || ''}
          onComplete={handleMeasurementComplete}
          onBack={handleBackToCamera}
          onNavigateToSizes={onNavigateToSizes}
        />
      );

    default:
      return null;
  }
};

export default NailMeasurement;