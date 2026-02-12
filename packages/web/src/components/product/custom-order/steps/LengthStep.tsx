import { NAIL_LENGTHS, NAIL_LENGTH_NAME, NailLength } from '@handy-platform/shared';
import { OrderStepLayout, OrderStepButton, NailLengthBar } from '../common';
import { FaCheck, FaLock } from 'react-icons/fa';

// 길이별 설명 (네일 업계 용어)
const LENGTH_DESCRIPTIONS: Record<NailLength, string> = {
  SHORT: '손톱 끝에서 2~3mm 정도, 일상생활에 편리하고 자연스러워요',
  MEDIUM: '손톱 끝에서 5~7mm 정도, 가장 인기있는 길이로 세련된 느낌',
  LONG: '손톱 끝에서 10mm 이상, 화려한 네일아트에 적합해요',
};

// 길이별 추천 상황
const LENGTH_RECOMMENDATIONS: Record<NailLength, string[]> = {
  SHORT: ['일상 생활', '직장인', '첫 네일'],
  MEDIUM: ['데일리룩', '특별한 날', '인기 선택'],
  LONG: ['파티룩', '웨딩', '포토슈팅'],
};

interface LengthStepProps {
  length: NailLength;
  onSelect: (length: NailLength) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
  fixed?: boolean;
}

export function LengthStep({
  length,
  onSelect,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
  fixed,
}: LengthStepProps) {
  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="길이는 어느 정도로 할까요?"
      subtitle={fixed ? '이 상품은 길이가 고정되어 있어요' : '선호하는 네일 길이를 선택해주세요'}
    >
      {/* 고정 길이 안내 */}
      {fixed && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center gap-3">
          <FaLock className="text-gray-400 w-4 h-4 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            이 상품은 <span className="font-semibold text-gray-900">{NAIL_LENGTH_NAME[length]}</span> 길이로만 주문 가능합니다
          </p>
        </div>
      )}

      {/* 길이 선택 카드 */}
      <div className="space-y-3 flex-1">
        {NAIL_LENGTHS.map((l) => {
          const isSelected = length === l;
          const isDisabled = fixed && !isSelected;
          return (
            <button
              key={l}
              type="button"
              onClick={() => !fixed && onSelect(l)}
              disabled={isDisabled}
              className={`
                relative w-full p-4 rounded-2xl border-2 text-left transition-all
                ${isSelected
                  ? 'border-pink-500 bg-pink-50'
                  : isDisabled
                    ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-40'
                    : 'border-gray-200 bg-white hover:border-pink-200'
                }
              `}
            >
              {/* 선택 체크 */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <FaCheck className="w-3 h-3 text-white" />
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* 길이 시각화 바 */}
                <NailLengthBar length={l} selected={isSelected} />

                {/* 텍스트 정보 */}
                <div className="flex-1 pr-8">
                  <p className={`font-semibold ${isSelected ? 'text-pink-700' : 'text-gray-900'}`}>
                    {NAIL_LENGTH_NAME[l]}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{LENGTH_DESCRIPTIONS[l]}</p>

                  {/* 추천 태그 */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {LENGTH_RECOMMENDATIONS[l].map((tag) => (
                      <span
                        key={tag}
                        className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${isSelected
                            ? 'bg-pink-200 text-pink-700'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
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
