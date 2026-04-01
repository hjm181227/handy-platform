import { useTranslation } from 'react-i18next';
import { NAIL_LENGTHS, NailLength } from '@handy-platform/shared';
import { OrderStepLayout, OrderStepButton, NailLengthBar } from '../common';
import { FaCheck, FaLock } from 'react-icons/fa';

// 길이별 추천 태그 키 매핑
const LENGTH_TAG_KEYS: Record<NailLength, string[]> = {
  SHORT: ['lengthTag_dailyLife', 'lengthTag_officeWorker', 'lengthTag_firstNail'],
  MEDIUM: ['lengthTag_dailyLook', 'lengthTag_specialDay', 'lengthTag_popularChoice'],
  LONG: ['lengthTag_partyLook', 'lengthTag_wedding', 'lengthTag_photoShoot'],
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
  const { t } = useTranslation(['product', 'common', 'nail']);

  // 길이 이름을 i18n에서 가져오기
  const getLengthName = (l: NailLength) => t(`nail:length.${l}`);

  // 길이별 설명을 i18n에서 가져오기
  const getLengthDescription = (l: NailLength) => t(`product:customOrder.lengthDesc_${l}`);

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title={t('product:customOrder.lengthQuestion')}
      subtitle={fixed ? t('product:customOrder.lengthSubtitleFixed') : t('product:customOrder.lengthSubtitle')}
    >
      {/* 고정 길이 안내 */}
      {fixed && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center gap-3">
          <FaLock className="text-gray-400 w-4 h-4 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            {t('product:customOrder.lengthFixed', { length: getLengthName(length) })}
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
                    {getLengthName(l)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{getLengthDescription(l)}</p>

                  {/* 추천 태그 */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {LENGTH_TAG_KEYS[l].map((tagKey) => (
                      <span
                        key={tagKey}
                        className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${isSelected
                            ? 'bg-pink-200 text-pink-700'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        {t(`product:customOrder.${tagKey}`)}
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
          {t('product:customOrder.next')}
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
