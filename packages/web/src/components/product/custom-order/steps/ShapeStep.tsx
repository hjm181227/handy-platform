import { NAIL_SHAPES, NAIL_SHAPE_NAME, NailShape } from '@handy-platform/shared';
import { OrderStepLayout, SelectionGridCard, OrderStepButton } from '../common';

// 쉐입별 아이콘/이모지 매핑
const SHAPE_ICONS: Record<NailShape, string> = {
  ROUND: '🔵',
  SQUARE: '⬜',
  OVAL: '🥚',
  ALMOND: '🌰',
  STILETTO: '📍',
  COFFIN: '⬛',
  SQUOVAL: '🔲',
  BALLERINA: '🩰',
};

// 쉐입별 설명
const SHAPE_DESCRIPTIONS: Record<NailShape, string> = {
  ROUND: '둥근 모양',
  SQUARE: '각진 모양',
  OVAL: '타원형',
  ALMOND: '아몬드형',
  STILETTO: '뾰족한 형태',
  COFFIN: '관 모양',
  SQUOVAL: '스퀘어+오벌',
  BALLERINA: '발레리나형',
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
        {NAIL_SHAPES.map((s) => (
          <SelectionGridCard
            key={s}
            selected={shape === s}
            onClick={() => onSelect(s)}
            label={NAIL_SHAPE_NAME[s]}
            icon={SHAPE_ICONS[s]}
            description={SHAPE_DESCRIPTIONS[s]}
          />
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
