import { NAIL_LENGTHS, NAIL_LENGTH_NAME, NailLength } from '@handy-platform/shared';
import { OrderStepLayout, SelectionCard, OrderStepButton } from '../common';

// 길이별 설명
const LENGTH_DESCRIPTIONS: Record<NailLength, string> = {
  SHORT: '자연스러운 짧은 길이, 일상생활에 편리해요',
  MEDIUM: '가장 인기있는 길이, 세련된 느낌을 줘요',
  LONG: '화려하고 눈에 띄는 길이, 특별한 날에 추천해요',
};

// 길이별 아이콘
const LENGTH_ICONS: Record<NailLength, string> = {
  SHORT: '📏',
  MEDIUM: '📐',
  LONG: '📏',
};

interface LengthStepProps {
  length: NailLength;
  onSelect: (length: NailLength) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function LengthStep({
  length,
  onSelect,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: LengthStepProps) {
  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="길이는 어느 정도로 할까요?"
      subtitle="선호하는 네일 길이를 선택해주세요"
    >
      {/* 길이 선택 카드 */}
      <div className="space-y-3 flex-1">
        {NAIL_LENGTHS.map((l) => (
          <SelectionCard
            key={l}
            selected={length === l}
            onClick={() => onSelect(l)}
            icon={LENGTH_ICONS[l]}
          >
            <div>
              <p className="font-semibold text-gray-900">{NAIL_LENGTH_NAME[l]}</p>
              <p className="text-sm text-gray-500 mt-1">{LENGTH_DESCRIPTIONS[l]}</p>
            </div>
          </SelectionCard>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-6">
        <OrderStepButton onClick={onNext}>
          다음
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
