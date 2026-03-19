import { useState } from 'react';
import { FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { OrderStepLayout, OrderStepButton, SelectionCard } from '../common';

interface DateStepProps {
  desiredDate: string;
  onUpdateDate: (date: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

// 최소 선택 가능 날짜 (오늘 + 7일)
const getMinDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

// 추천 날짜 옵션 생성 (1주, 2주, 3주 후)
const getRecommendedDates = () => {
  const today = new Date();
  return [
    { label: '1주 후', days: 7 },
    { label: '2주 후', days: 14 },
    { label: '3주 후', days: 21 },
  ].map(option => {
    const date = new Date(today);
    date.setDate(date.getDate() + option.days);
    return {
      ...option,
      date: date.toISOString().split('T')[0],
      formatted: `${date.getMonth() + 1}월 ${date.getDate()}일`,
    };
  });
};

export function DateStep({
  desiredDate,
  onUpdateDate,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: DateStepProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const recommendedDates = getRecommendedDates();

  // 선택된 날짜 포맷
  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="언제 받고 싶으세요?"
      subtitle="수령 희망 날짜를 선택해주세요"
    >
      <div className="flex-1">
        {/* 안내 메시지 */}
        <div className="bg-[#FFF1F2] rounded-xl p-4 mb-6 flex items-start gap-3">
          <FaInfoCircle className="w-5 h-5 text-[#E85A6B] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#D14A5B]">
            제작 기간을 고려하여 <strong>최소 7일 이후</strong> 날짜부터 선택 가능해요.
            정확한 일정은 판매자와 채팅으로 조율됩니다.
          </p>
        </div>

        {/* 추천 날짜 옵션 */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">빠른 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {recommendedDates.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => onUpdateDate(option.date)}
                className={`
                  py-3 px-2 rounded-xl border-2 text-center transition-all
                  ${desiredDate === option.date
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className={`text-xs mt-0.5 ${desiredDate === option.date ? 'text-gray-300' : 'text-gray-400'}`}>
                  {option.formatted}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 직접 선택 */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">직접 선택</p>
          <SelectionCard
            selected={showCalendar || (desiredDate !== '' && !recommendedDates.some(d => d.date === desiredDate))}
            onClick={() => setShowCalendar(!showCalendar)}
            icon={<FaCalendarAlt className="text-gray-600" />}
          >
            <div>
              <p className="font-semibold text-gray-900">
                {desiredDate && !recommendedDates.some(d => d.date === desiredDate)
                  ? formatSelectedDate(desiredDate)
                  : '캘린더에서 선택'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                원하는 날짜를 직접 선택해주세요
              </p>
            </div>
          </SelectionCard>

          {showCalendar && (
            <div className="mt-4">
              <input
                type="date"
                value={desiredDate}
                onChange={(e) => {
                  onUpdateDate(e.target.value);
                  setShowCalendar(false);
                }}
                min={getMinDate()}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-base
                         focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* 날짜 미선택 옵션 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => onUpdateDate('')}
            className={`
              w-full py-3 rounded-xl border-2 text-sm transition-all
              ${desiredDate === ''
                ? 'border-black bg-gray-50 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }
            `}
          >
            날짜를 정하지 않고 판매자와 상의할게요
          </button>
        </div>
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
