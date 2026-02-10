import React, { useState, useEffect } from 'react';
import { cameraService } from '../../services/cameraService';
import SelectionScreen from './SelectionScreen';
import CameraScreen from './CameraScreen';
import AIMeasurementScreen from './AIMeasurementScreen';
import { NailMeasurementResult } from '../../services/nailMeasurement/types';

type MeasurementStep = 'selection' | 'camera' | 'ai_measurement';
type FingerSelection = 'thumb' | 'four_fingers';

interface NailMeasurementProps {
  onClose?: () => void;
  onNavigateToSizes?: () => void;
  preselectedHand?: 'left' | 'right';
}

const NailMeasurement: React.FC<NailMeasurementProps> = ({
  onClose,
  onNavigateToSizes,
  preselectedHand
}) => {
  const [currentStep, setCurrentStep] = useState<MeasurementStep>('selection');
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>(preselectedHand || 'right');
  const [selectedFingerType, setSelectedFingerType] = useState<FingerSelection>('thumb');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementResult, setMeasurementResult] = useState<NailMeasurementResult | null>(null);
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

  const handlePhotoTaken = (imageUri: string, result?: NailMeasurementResult) => {
    setCapturedImage(imageUri);
    setMeasurementResult(result || null);
    setCurrentStep('ai_measurement');
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setCapturedImage(null);
    setMeasurementResult(null);
  };

  const handleBackToCamera = () => {
    setCurrentStep('camera');
  };

  const handleMeasurementComplete = () => {
    // 측정 완료 후 처음으로 돌아가기
    setCurrentStep('selection');
    setCapturedImage(null);
    setMeasurementResult(null);
  };

  // 다시 촬영
  const handleRetake = () => {
    setCapturedImage(null);
    setMeasurementResult(null);
    setCurrentStep('camera');
  };

  // 권한 확인 중이거나 권한이 없는 경우 selection 화면 표시
  if (hasPermission === null || hasPermission === false) {
    return (
      <SelectionScreen
        selectedHand={selectedHand}
        selectedFingerType={selectedFingerType}
        onHandSelect={setSelectedHand}
        onFingerTypeSelect={setSelectedFingerType}
        onStartCamera={() => {
          if (hasPermission === false) {
            // 권한 재요청
            cameraService.requestCameraPermission().then(setHasPermission);
          } else {
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
          selectedFingerType={selectedFingerType}
          onHandSelect={setSelectedHand}
          onFingerTypeSelect={setSelectedFingerType}
          onStartCamera={handleStartCamera}
          onClose={onClose || (() => {})}
        />
      );

    case 'camera':
      return (
        <CameraScreen
          selectedHand={selectedHand}
          selectedFinger={selectedFingerType === 'thumb' ? '엄지' : '4손가락'}
          isThumbOnly={selectedFingerType === 'thumb'}
          onPhotoTaken={handlePhotoTaken}
          onBack={handleBackToSelection}
        />
      );

    case 'ai_measurement':
      return (
        <AIMeasurementScreen
          selectedHand={selectedHand}
          selectedFinger={selectedFingerType === 'thumb' ? '엄지' : '검지'}
          imageUri={capturedImage || ''}
          isThumbOnly={selectedFingerType === 'thumb'}
          initialMeasurementResult={measurementResult || undefined}
          onComplete={handleMeasurementComplete}
          onBack={handleBackToCamera}
          onRetake={handleRetake}
          onNavigateToSizes={onNavigateToSizes}
        />
      );

    default:
      return null;
  }
};

export default NailMeasurement;
