import { useTranslation } from 'react-i18next';
import { NAIL_SHAPES, NailShape } from '@handy-platform/shared';
import { OrderStepLayout, OrderStepButton, NailShapeIcon } from '../common';
import { FaCheck, FaLock } from 'react-icons/fa';

interface ShapeStepProps {
  shape: NailShape;
  onSelect: (shape: NailShape) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
  fixed?: boolean;
}

export function ShapeStep({
  shape,
  onSelect,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
  fixed,
}: ShapeStepProps) {
  const { t } = useTranslation(['product', 'common', 'nail']);

  // 쉐입별 설명을 i18n에서 가져오기
  const getShapeDescription = (s: NailShape) => t(`product:customOrder.shapeDesc_${s}`);

  // 쉐입 이름을 i18n에서 가져오기
  const getShapeName = (s: NailShape) => t(`nail:shape.${s}`);

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title={t('product:customOrder.shapeQuestion')}
      subtitle={fixed ? t('product:customOrder.shapeSubtitleFixed') : t('product:customOrder.shapeSubtitle')}
    >
      {/* 고정 쉐입 안내 */}
      {fixed && (
        <div className="bg-surface rounded-xl p-4 mb-4 flex items-center gap-3">
          <FaLock className="text-muted w-4 h-4 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            {t('product:customOrder.shapeFixed', { shape: getShapeName(shape) })}
          </p>
        </div>
      )}

      {/* 쉐입 선택 그리드 */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {NAIL_SHAPES.map((s) => {
          const isSelected = shape === s;
          const isDisabled = fixed && !isSelected;
          return (
            <button
              key={s}
              type="button"
              onClick={() => !fixed && onSelect(s)}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all
                ${isSelected
                  ? 'border-brand bg-brand text-white'
                  : isDisabled
                    ? 'border-gray-100 bg-surface text-gray-300 cursor-not-allowed opacity-40'
                    : 'border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50'
                }
              `}
            >
              {/* 선택 체크 */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <FaCheck className="w-3 h-3 text-brand" />
                </div>
              )}

              {/* 네일 쉐입 아이콘 */}
              <div className="mb-2">
                <NailShapeIcon shape={s} selected={isSelected} />
              </div>

              {/* 쉐입 이름 */}
              <span className="font-semibold text-sm">{getShapeName(s)}</span>

              {/* 설명 (선택된 경우에만 표시) */}
              {isSelected && (
                <span className="text-xs mt-1 text-brand-100 text-center line-clamp-2">
                  {getShapeDescription(s)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 쉐입 설명 */}
      <div className="bg-brand-50 rounded-xl p-4 mt-4">
        <p className="text-sm text-brand-700">
          <span className="font-semibold">{getShapeName(shape)}</span>
          <span className="mx-2">·</span>
          {getShapeDescription(shape)}
        </p>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-6">
        <OrderStepButton onClick={onNext}>
          {t('product:customOrder.next')}
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
