import { StepButton } from '../common';

interface CompleteStepProps {
  onComplete: () => void;
  userName?: string;
}

export function CompleteStep({ onComplete, userName }: CompleteStepProps) {
  return (
    <div className="h-full min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10 mx-auto max-w-md overflow-y-auto">
      {/* 축하 아이콘 */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="text-5xl">🎉</span>
        </div>
      </div>

      {/* 메시지 */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
        가입이 완료되었어요!
      </h1>

      {userName && (
        <p className="text-lg text-gray-700 mb-4">
          환영해요, <span className="font-semibold">{userName}</span>님
        </p>
      )}

      {/* 포인트 적립 안내 */}
      <div className="mt-4 mb-8 px-6 py-4 bg-blue-50 rounded-xl">
        <p className="text-blue-800 text-center">
          <span className="font-bold text-lg">1,000P</span>
          <span className="text-sm ml-1">가 적립되었습니다</span>
        </p>
      </div>

      {/* 혜택 안내 */}
      <div className="w-full max-w-sm mb-8 space-y-3">
        <BenefitItem
          icon="🎁"
          text="신규 가입 포인트 1,000P"
        />
        <BenefitItem
          icon="🛒"
          text="첫 구매 시 10% 할인 쿠폰"
        />
        <BenefitItem
          icon="🚚"
          text="3만원 이상 무료 배송"
        />
      </div>

      {/* CTA 버튼 */}
      <div className="w-full max-w-sm">
        <StepButton onClick={onComplete}>
          쇼핑 시작하기
        </StepButton>
      </div>
    </div>
  );
}

// 혜택 아이템 컴포넌트
function BenefitItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
      <span className="text-xl">{icon}</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
