import { NAIL_SHAPES, NAIL_SHAPE_NAME, NailShape } from '@handy-platform/shared';
import { OrderStepLayout, OrderStepButton, NailShapeIcon } from '../common';
import { FaCheck } from 'react-icons/fa';

// 쉐입별 설명 (네일 업계 용어)
const SHAPE_DESCRIPTIONS: Record<NailShape, string> = {
  ROUND: '손톱 끝을 따라 자연스럽게 둥글린 클래식한 모양',
  SQUARE: '양 끝이 직각으로 떨어지는 모던한 모양',
  OVAL: '손가락이 길어 보이는 우아한 타원형',
  ALMOND: '끝이 뾰족하면서 부드러운 아몬드 모양',
  STILETTO: '날카롭게 뾰족한 대담한 스타일',
  COFFIN: '끝이 평평한 관 모양, 트렌디한 스타일',
  SQUOVAL: '스퀘어와 오벌의 장점을 합친 모양',
  BALLERINA: '코핀과 유사하나 더 우아하고 여성스러운 형태',
};

interface ShapeStepProps {
  shape: NailShape;
  onSelect: (shape: NailShape) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function ShapeStep({
  shape,
  onSelect,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: ShapeStepProps) {
  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="어떤 모양을 원하세요?"
      subtitle="원하는 네일 쉐입을 선택해주세요"
    >
      {/* 쉐입 선택 그리드 */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {NAIL_SHAPES.map((s) => {
          const isSelected = shape === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`
                relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all
                ${isSelected
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-pink-200 hover:bg-pink-50'
                }
              `}
            >
              {/* 선택 체크 */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <FaCheck className="w-3 h-3 text-pink-500" />
                </div>
              )}

              {/* 네일 쉐입 아이콘 */}
              <div className="mb-2">
                <NailShapeIcon shape={s} selected={isSelected} />
              </div>

              {/* 쉐입 이름 */}
              <span className="font-semibold text-sm">{NAIL_SHAPE_NAME[s]}</span>

              {/* 설명 (선택된 경우에만 표시) */}
              {isSelected && (
                <span className="text-xs mt-1 text-pink-100 text-center line-clamp-2">
                  {SHAPE_DESCRIPTIONS[s]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 쉐입 설명 */}
      <div className="bg-pink-50 rounded-xl p-4 mt-4">
        <p className="text-sm text-pink-800">
          <span className="font-semibold">{NAIL_SHAPE_NAME[shape]}</span>
          <span className="mx-2">·</span>
          {SHAPE_DESCRIPTIONS[shape]}
        </p>
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
