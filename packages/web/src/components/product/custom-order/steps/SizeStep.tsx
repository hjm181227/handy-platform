import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Pencil, Check, Ruler, ScanLine, CircleAlert } from 'lucide-react';
import { OrderStepLayout, OrderStepButton } from '../common';
import { FingerSizes, HandSizes } from '../../../../hooks/useCustomOrderFlow';
import { NailSizeData } from '@handy-platform/shared/src/services/user/UserService';
import navigateService from '@handy-platform/shared/src/services/navigate/NavigateService.web';

// 손가락 순서
const FINGER_ORDER: (keyof FingerSizes)[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

// NailSizeData의 손가락 키 (pinky → little 매핑)
const NAIL_SIZE_KEYS: Record<keyof FingerSizes, string> = {
  thumb: 'thumb',
  index: 'index',
  middle: 'middle',
  ring: 'ring',
  pinky: 'little',
};

interface SizeStepProps {
  sizes: HandSizes;
  userNailSize: NailSizeData | null;
  onUpdateSize: (hand: 'left' | 'right', finger: keyof FingerSizes, value: string) => void;
  onRefreshNailSize: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function SizeStep({
  sizes,
  userNailSize,
  onUpdateSize,
  onRefreshNailSize,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: SizeStepProps) {
  const { t } = useTranslation(['product', 'common', 'nail']);
  const [mode, setMode] = useState<'saved' | 'manual'>('saved');
  const [activeHand, setActiveHand] = useState<'left' | 'right'>('left');

  // 저장된 사이즈에서 손가락 값 가져오기
  const getSavedFingerValue = (hand: 'leftHand' | 'rightHand', finger: keyof FingerSizes): number => {
    if (!userNailSize) return 0;
    const key = NAIL_SIZE_KEYS[finger] as keyof typeof userNailSize.leftHand;
    return userNailSize[hand][key] ?? 0;
  };

  // 손별 측정 상태 계산
  const getHandStatus = (hand: 'leftHand' | 'rightHand') => {
    const measured: { finger: keyof FingerSizes; value: number }[] = [];
    const missing: (keyof FingerSizes)[] = [];

    FINGER_ORDER.forEach(finger => {
      const val = getSavedFingerValue(hand, finger);
      if (val > 0) {
        measured.push({ finger, value: val });
      } else {
        missing.push(finger);
      }
    });

    return { measured, missing };
  };

  const leftStatus = getHandStatus('leftHand');
  const rightStatus = getHandStatus('rightHand');

  // 전체 측정 완료 여부
  const isSavedComplete = userNailSize !== null &&
    leftStatus.missing.length === 0 &&
    rightStatus.missing.length === 0;

  // 데이터 존재 여부 (하나라도 측정된 게 있는지)
  const hasAnyData = userNailSize !== null &&
    (leftStatus.measured.length > 0 || rightStatus.measured.length > 0);

  // 직접 입력 완료 여부
  const isManualComplete =
    Object.values(sizes.left).every(s => s.trim() !== '') &&
    Object.values(sizes.right).every(s => s.trim() !== '');

  // CTA 활성 조건
  const canProceed =
    (mode === 'saved' && isSavedComplete) ||
    (mode === 'manual' && isManualComplete);

  // 측정 후 복귀 시 데이터 자동 반영
  const handleRefresh = useCallback(() => {
    onRefreshNailSize();
  }, [onRefreshNailSize]);

  useEffect(() => {
    // 웹 브라우저용: 탭 전환 복귀 시
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    // 앱 WebView용: 네이티브에서 측정 완료 후 메시지 수신
    const handleNativeMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'NAIL_SIZE_UPDATED') {
          handleRefresh();
        }
      } catch {
        // ignore parse errors
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('message', handleNativeMessage);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('message', handleNativeMessage);
    };
  }, [handleRefresh]);

  // 측정하기 버튼 클릭 핸들러
  const handleMeasure = () => {
    navigateService.goToMeasureSize();
  };

  // 체크 서클 컴포넌트
  const CheckCircle = ({ checked }: { checked: boolean }) =>
    checked ? (
      <div className="w-7 h-7 bg-[#131211] rounded-full flex items-center justify-center flex-shrink-0">
        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      </div>
    ) : (
      <div className="w-7 h-7 border-2 border-[#E5E0DC] rounded-full flex-shrink-0" />
    );

  // Empty State (NO DATA) 렌더링
  const renderEmptyState = () => (
    <div className="flex flex-col items-center py-6">
      <div className="w-14 h-14 bg-[#F5F5F5] rounded-2xl flex items-center justify-center mb-3">
        <Ruler className="w-7 h-7 text-[#D0C9C3]" />
      </div>
      <p className="text-[15px] font-semibold text-[#131211] mb-1">{t('product:customOrder.noSavedSize')}</p>
      <p className="text-[13px] text-[#A39E99] mb-4">{t('product:customOrder.noSavedSizeDesc')}</p>
      <button
        type="button"
        onClick={handleMeasure}
        className="flex items-center gap-2 px-5 h-10 border border-[#131211] rounded-xl text-[14px] font-semibold text-[#131211] hover:bg-gray-50 transition-colors"
      >
        <ScanLine className="w-4 h-4" />
        {t('product:customOrder.measureSize')}
      </button>
    </div>
  );

  // 손별 섹션 렌더링 (PARTIAL / COMPLETE)
  const renderHandSection = (
    hand: 'leftHand' | 'rightHand',
    label: string,
    status: { measured: { finger: keyof FingerSizes; value: number }[]; missing: (keyof FingerSizes)[] },
  ) => (
    <div>
      <p className="text-[15px] font-bold text-[#131211] mb-2">{label}</p>

      {/* 측정된 손가락 칩 */}
      {status.measured.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {status.measured.map(({ finger, value }) => (
            <span
              key={finger}
              className="text-xs font-medium text-[#131211] bg-[#F5F5F5] px-3 py-1.5 rounded-xl"
            >
              {t(`nail:finger.${finger}`)}: {value}mm
            </span>
          ))}
        </div>
      )}

      {/* 미측정 손가락 경고 블록 */}
      {status.missing.length > 0 && (
        <div className="bg-[#FFF8F5] rounded-xl p-3 mt-1">
          <div className="flex items-center gap-1.5 mb-2">
            <CircleAlert className="w-4 h-4 text-[#E85A6B]" />
            <span className="text-[13px] font-semibold text-[#E85A6B]">
              {t('product:customOrder.remainingFingers', { count: status.missing.length })}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {status.missing.map(finger => (
              <span
                key={finger}
                className="text-xs font-medium text-[#A39E99] border border-[#D0C9C3] px-3 py-1.5 rounded-xl"
              >
                {t(`nail:finger.${finger}`)}: --
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleMeasure}
            className="flex items-center justify-center gap-2 w-full h-10 border-[1.5px] border-[#E85A6B] rounded-xl text-[13px] font-semibold text-[#E85A6B] hover:bg-red-50 transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            {t('product:customOrder.measureRemaining')}
          </button>
        </div>
      )}
    </div>
  );

  // 저장된 사이즈 카드 내용 (선택 시)
  const renderSavedContent = () => {
    // No Data
    if (!userNailSize || (!hasAnyData)) {
      return renderEmptyState();
    }

    // Partial 또는 Complete
    return (
      <div className="space-y-3">
        {renderHandSection('leftHand', t('product:customOrder.leftHand'), leftStatus)}
        <div className="border-t border-[#F5F5F5]" />
        {renderHandSection('rightHand', t('product:customOrder.rightHand'), rightStatus)}
      </div>
    );
  };

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title={t('product:customOrder.sizeQuestion')}
      subtitle={t('product:customOrder.sizeSubtitle')}
    >
      {/* 저장된 사이즈 카드 — 항상 표시 */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setMode('saved')}
          className={`
            w-full text-left rounded-2xl p-5 transition-all
            ${mode === 'saved'
              ? 'border-2 border-[#131211] bg-white'
              : 'border border-[#E5E0DC] bg-white'
            }
          `}
        >
          {/* Header row */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0">
              <Save className="w-5 h-5 text-[#A39E99]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#131211]">{t('product:customOrder.useSavedSize')}</p>
              <p className="text-sm text-[#A39E99] mt-0.5">
                {t('product:customOrder.useSavedSizeDesc')}
              </p>
            </div>
            <CheckCircle checked={mode === 'saved'} />
          </div>

          {/* 선택 시 내용 표시 */}
          {mode === 'saved' && (
            <div className="mt-4 pt-4 border-t border-[#F5F5F5]">
              {renderSavedContent()}
            </div>
          )}
        </button>
      </div>

      {/* 직접 입력 카드 — 항상 표시 */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`
            w-full text-left rounded-2xl p-5 transition-all
            ${mode === 'manual'
              ? 'border-2 border-[#131211] bg-white'
              : 'border border-[#E5E0DC] bg-white'
            }
          `}
        >
          {/* Header row */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0">
              <Pencil className="w-5 h-5 text-[#A39E99]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#131211]">{t('product:customOrder.manualInput')}</p>
              <p className="text-sm text-[#A39E99] mt-0.5">
                {t('product:customOrder.manualInputDesc')}
              </p>
            </div>
            <CheckCircle checked={mode === 'manual'} />
          </div>
        </button>
      </div>

      {/* 직접 입력 필드 — manual 모드일 때만 */}
      {mode === 'manual' && (
        <>
          {/* 왼손/오른손 탭 */}
          <div className="bg-[#F5F5F5] rounded-xl p-1 flex mb-5">
            <button
              type="button"
              onClick={() => setActiveHand('left')}
              className={`
                flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all
                ${activeHand === 'left'
                  ? 'bg-white text-[#131211] shadow-sm'
                  : 'text-[#A39E99]'
                }
              `}
            >
              {t('product:customOrder.leftHand')}
            </button>
            <button
              type="button"
              onClick={() => setActiveHand('right')}
              className={`
                flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all
                ${activeHand === 'right'
                  ? 'bg-white text-[#131211] shadow-sm'
                  : 'text-[#A39E99]'
                }
              `}
            >
              {t('product:customOrder.rightHand')}
            </button>
          </div>

          {/* 입력 폼 */}
          <div className="border border-[#E5E0DC] rounded-2xl p-4 space-y-4 mb-4">
            {FINGER_ORDER.map((finger) => (
              <div key={finger} className="flex items-center gap-3">
                <span className="w-10 text-[15px] font-semibold text-[#131211]">
                  {t(`nail:finger.${finger}`)}
                </span>
                <div className="flex-1 flex items-center bg-[#F5F5F5] rounded-xl h-12 px-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sizes[activeHand][finger]}
                    onChange={(e) => onUpdateSize(activeHand, finger, e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent text-base font-medium text-[#131211] outline-none placeholder-[#D5D0CC]"
                  />
                  <span className="text-sm font-medium text-[#A39E99] ml-2">mm</span>
                </div>
              </div>
            ))}
          </div>

          {/* 안내 문구 */}
          <p className="text-[13px] text-[#A39E99] text-center mb-4">
            {t('product:customOrder.sizeInputHint')}
          </p>
        </>
      )}

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-auto">
        <OrderStepButton
          onClick={onNext}
          disabled={!canProceed}
        >
          {canProceed ? t('product:customOrder.next') : t('product:customOrder.enterAllSizes')}
        </OrderStepButton>
      </div>
    </OrderStepLayout>
  );
}
