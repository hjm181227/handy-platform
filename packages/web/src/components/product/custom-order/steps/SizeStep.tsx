import { useState } from 'react';
import { FaRuler, FaMobileAlt, FaCheck } from 'react-icons/fa';
import { OrderStepLayout, OrderStepButton, SelectionCard } from '../common';
import { FingerSizes } from '../../../../hooks/useCustomOrderFlow';
import { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';
import navigateService from '@handy-platform/shared/src/services/navigate/NavigateService.web';

// 손가락 한글명
const FINGER_NAMES: Record<keyof FingerSizes, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지',
};

// 손가락 순서
const FINGER_ORDER: (keyof FingerSizes)[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

interface SizeStepProps {
  sizes: FingerSizes;
  userNailSize: NailSizeData | null;
  onUpdateSize: (finger: keyof FingerSizes, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function SizeStep({
  sizes,
  userNailSize,
  onUpdateSize,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: SizeStepProps) {
  const [mode, setMode] = useState<'saved' | 'manual'>(userNailSize ? 'saved' : 'manual');

  // 사이즈가 모두 입력되었는지 확인
  const isComplete = Object.values(sizes).every(s => s.trim() !== '');

  // 저장된 사이즈가 있는지 확인
  const hasSavedSize = userNailSize !== null;

  // 측정하기 버튼 클릭 핸들러
  const handleMeasure = () => {
    navigateService.goToMeasureSize();
  };

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="사이즈를 알려주세요"
      subtitle="정확한 사이즈로 딱 맞는 네일을 받아보세요"
    >
      {/* 저장된 사이즈가 있는 경우 */}
      {hasSavedSize && (
        <div className="mb-6">
          <SelectionCard
            selected={mode === 'saved'}
            onClick={() => setMode('saved')}
            icon={<FaCheck className="text-green-500" />}
          >
            <div>
              <p className="font-semibold text-gray-900">저장된 사이즈 사용</p>
              <p className="text-sm text-gray-500 mt-1">
                이전에 측정한 사이즈를 사용합니다
              </p>
              {userNailSize && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {FINGER_ORDER.map((finger) => {
                    const fingerKey = finger === 'pinky' ? 'little' : finger;
                    const size = userNailSize.leftHand[fingerKey as keyof typeof userNailSize.leftHand];
                    return (
                      <span key={finger} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {FINGER_NAMES[finger]}: {size}mm
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </SelectionCard>
        </div>
      )}

      {/* 직접 입력 모드 */}
      <div className="mb-4">
        <SelectionCard
          selected={mode === 'manual' || !hasSavedSize}
          onClick={() => setMode('manual')}
          icon={<FaRuler className="text-gray-600" />}
        >
          <div>
            <p className="font-semibold text-gray-900">직접 입력</p>
            <p className="text-sm text-gray-500 mt-1">
              각 손가락의 사이즈를 직접 입력해주세요
            </p>
          </div>
        </SelectionCard>
      </div>

      {/* 직접 입력 필드 */}
      {(mode === 'manual' || !hasSavedSize) && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <div className="space-y-3">
            {FINGER_ORDER.map((finger) => (
              <div key={finger} className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium text-gray-700">
                  {FINGER_NAMES[finger]}
                </span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sizes[finger]}
                    onChange={(e) => onUpdateSize(finger, e.target.value)}
                    placeholder="예: 12"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                             focus:ring-2 focus:ring-black focus:border-transparent
                             transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    mm
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            네일 너비(가로)를 mm 단위로 입력해주세요
          </p>
        </div>
      )}

      {/* 측정하기 안내 */}
      {!hasSavedSize && (
        <div className="bg-purple-50 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaMobileAlt className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">사이즈를 모르시나요?</p>
              <p className="text-xs text-gray-600 mt-1">
                HANDY 앱에서 AR 카메라로 간편하게 사이즈를 측정할 수 있어요
              </p>
              <button
                onClick={handleMeasure}
                className="mt-3 text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                사이즈 측정하기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-auto">
        <OrderStepButton
          onClick={onNext}
          disabled={!isComplete && mode === 'manual'}
        >
          {isComplete || mode === 'saved' ? '다음' : '사이즈를 모두 입력해주세요'}
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
