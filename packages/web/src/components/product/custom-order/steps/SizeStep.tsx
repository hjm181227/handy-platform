import { useState } from 'react';
import { FaRuler, FaMobileAlt, FaCheck } from 'react-icons/fa';
import { OrderStepLayout, OrderStepButton, SelectionCard } from '../common';
import { FingerSizes, HandSizes } from '../../../../hooks/useCustomOrderFlow';
import { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';
import navigateService from '@handy-platform/shared/src/services/navigate/NavigateService.web';

// 손가락 한글명
const FINGER_NAMES: Record<keyof HandSizes, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  little: '소지',
};

// 손가락 순서
const FINGER_ORDER: (keyof HandSizes)[] = ['thumb', 'index', 'middle', 'ring', 'little'];

interface SizeStepProps {
  sizes: FingerSizes;
  userNailSize: NailSizeData | null;
  onUpdateSize: (hand: 'leftHand' | 'rightHand', finger: keyof HandSizes, value: string) => void;
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
  const [activeHand, setActiveHand] = useState<'leftHand' | 'rightHand'>('leftHand');

  // 양손 사이즈가 모두 입력되었는지 확인
  const isLeftComplete = Object.values(sizes.leftHand).every(s => s.trim() !== '');
  const isRightComplete = Object.values(sizes.rightHand).every(s => s.trim() !== '');
  const isComplete = isLeftComplete && isRightComplete;

  // 저장된 사이즈가 있는지 확인
  const hasSavedSize = userNailSize !== null;

  // 저장된 사이즈가 완전한지 확인 (양손 모두)
  const hasSavedLeftHand = userNailSize && Object.values(userNailSize.leftHand).every(v => v > 0);
  const hasSavedRightHand = userNailSize && Object.values(userNailSize.rightHand).every(v => v > 0);
  const hasCompleteSavedSize = hasSavedLeftHand && hasSavedRightHand;

  // 측정하기 버튼 클릭 핸들러
  const handleMeasure = () => {
    navigateService.goToMeasureSize();
  };

  // 한 손의 손가락 입력 렌더링
  const renderHandInputs = (hand: 'leftHand' | 'rightHand') => {
    const handSizes = sizes[hand];
    const savedHandSizes = userNailSize?.[hand];

    return (
      <div className="space-y-2">
        {FINGER_ORDER.map((finger) => {
          const savedSize = savedHandSizes?.[finger];
          return (
            <div key={`${hand}-${finger}`} className="flex items-center gap-3">
              <span className="w-10 text-sm font-medium text-gray-700">
                {FINGER_NAMES[finger]}
              </span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={handSizes[finger]}
                  onChange={(e) => onUpdateSize(hand, finger, e.target.value)}
                  placeholder={savedSize && savedSize > 0 ? `${savedSize}` : '예: 12.5'}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                           focus:ring-2 focus:ring-pink-400 focus:border-transparent
                           transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  mm
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 저장된 사이즈 미리보기
  const renderSavedSizePreview = (hand: 'leftHand' | 'rightHand', label: string, icon: string) => {
    if (!userNailSize) return null;
    const handData = userNailSize[hand];

    return (
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {FINGER_ORDER.map((finger) => {
            const size = handData[finger];
            return (
              <span
                key={finger}
                className={`text-xs px-2 py-1 rounded ${
                  size > 0 ? 'bg-pink-100 text-pink-700' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {FINGER_NAMES[finger]}: {size > 0 ? `${size}mm` : '-'}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="손톱 사이즈를 알려주세요"
      subtitle="양손 모든 손가락의 너비를 입력해주세요"
    >
      {/* 저장된 사이즈가 있는 경우 */}
      {hasSavedSize && (
        <div className="mb-6">
          <SelectionCard
            selected={mode === 'saved'}
            onClick={() => setMode('saved')}
            icon={<FaCheck className="text-green-500" />}
          >
            <div className="w-full">
              <p className="font-semibold text-gray-900">저장된 사이즈 사용</p>
              <p className="text-sm text-gray-500 mt-1">
                {hasCompleteSavedSize
                  ? '이전에 측정한 양손 사이즈를 사용합니다'
                  : '일부 측정되지 않은 손가락이 있습니다'}
              </p>
              {userNailSize && (
                <div className="mt-3 space-y-2">
                  {renderSavedSizePreview('leftHand', '왼손', '🤚')}
                  {renderSavedSizePreview('rightHand', '오른손', '✋')}
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
              양손 각 손가락의 사이즈를 직접 입력해주세요
            </p>
          </div>
        </SelectionCard>
      </div>

      {/* 직접 입력 필드 */}
      {(mode === 'manual' || !hasSavedSize) && (
        <div className="mb-4">
          {/* 손 탭 선택 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveHand('leftHand')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeHand === 'leftHand'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>🤚</span>
              <span>왼손</span>
              {isLeftComplete && <FaCheck className="text-xs" />}
            </button>
            <button
              onClick={() => setActiveHand('rightHand')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeHand === 'rightHand'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>✋</span>
              <span>오른손</span>
              {isRightComplete && <FaCheck className="text-xs" />}
            </button>
          </div>

          {/* 활성 손 입력 필드 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{activeHand === 'leftHand' ? '🤚' : '✋'}</span>
              <span className="font-semibold text-gray-900">
                {activeHand === 'leftHand' ? '왼손' : '오른손'}
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                {activeHand === 'leftHand'
                  ? (isLeftComplete ? '✓ 입력 완료' : `${Object.values(sizes.leftHand).filter(s => s.trim() !== '').length}/5`)
                  : (isRightComplete ? '✓ 입력 완료' : `${Object.values(sizes.rightHand).filter(s => s.trim() !== '').length}/5`)}
              </span>
            </div>
            {renderHandInputs(activeHand)}
          </div>

          {/* 입력 상태 요약 */}
          <div className="flex gap-2 mt-3">
            <div className={`flex-1 py-2 px-3 rounded-lg text-xs text-center ${
              isLeftComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              왼손 {isLeftComplete ? '완료 ✓' : `${Object.values(sizes.leftHand).filter(s => s.trim() !== '').length}/5`}
            </div>
            <div className={`flex-1 py-2 px-3 rounded-lg text-xs text-center ${
              isRightComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              오른손 {isRightComplete ? '완료 ✓' : `${Object.values(sizes.rightHand).filter(s => s.trim() !== '').length}/5`}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            손톱 너비(가로)를 mm 단위로 입력해주세요
          </p>
        </div>
      )}

      {/* 측정하기 안내 */}
      {!hasCompleteSavedSize && (
        <div className="bg-purple-50 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaMobileAlt className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">사이즈를 모르시나요?</p>
              <p className="text-xs text-gray-600 mt-1">
                HANDY 앱에서 AR 카메라로 간편하게 양손 사이즈를 측정할 수 있어요
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
          {isComplete || mode === 'saved'
            ? '다음'
            : `양손 사이즈를 모두 입력해주세요 (${
                Object.values(sizes.leftHand).filter(s => s.trim() !== '').length +
                Object.values(sizes.rightHand).filter(s => s.trim() !== '').length
              }/10)`}
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
