import { FaEdit } from 'react-icons/fa';
import { Product, NAIL_SHAPE_NAME, NAIL_LENGTH_NAME, NailShape, NailLength } from '@handy-platform/shared';
import { OrderStepLayout, OrderStepButton } from '../common';
import { CustomOrderFormData, FingerSizes } from '../../../../hooks/useCustomOrderFlow';

// 손가락 한글명
const FINGER_NAMES: Record<keyof FingerSizes, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지',
};

interface ConfirmStepProps {
  data: CustomOrderFormData;
  product: Product;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
  submitting: boolean;
  error: string | null;
  stepIndex: number;
  totalSteps: number;
}

export function ConfirmStep({
  data,
  product,
  onSubmit,
  onBack,
  onEdit,
  submitting,
  error,
  stepIndex,
  totalSteps,
}: ConfirmStepProps) {
  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '판매자와 상의 예정';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <OrderStepLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onBack={onBack}
      title="주문 내용을 확인해주세요"
      subtitle="입력하신 내용이 맞는지 확인 후 주문해주세요"
    >
      <div className="flex-1 space-y-4">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 브랜드/상품 정보 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">브랜드</p>
          <p className="font-semibold text-gray-900 mt-1">
            {product.seller?.companyName || product.brand || '브랜드 정보 없음'}
          </p>
          <p className="text-sm text-gray-600 mt-2">{product.name}</p>
        </div>

        {/* 쉐입 & 길이 */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">쉐입 & 길이</h3>
            <button
              onClick={() => onEdit(0)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">쉐입</p>
              <p className="font-medium text-gray-900 mt-1">
                {NAIL_SHAPE_NAME[data.shape as NailShape]}
              </p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">길이</p>
              <p className="font-medium text-gray-900 mt-1">
                {NAIL_LENGTH_NAME[data.length as NailLength]}
              </p>
            </div>
          </div>
        </div>

        {/* 사이즈 */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">사이즈</h3>
            <button
              onClick={() => onEdit(2)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">왼손</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.sizes.left).map(([finger, size]) => (
                  <span
                    key={finger}
                    className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm"
                  >
                    {FINGER_NAMES[finger as keyof FingerSizes]}: {size}mm
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">오른손</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.sizes.right).map(([finger, size]) => (
                  <span
                    key={finger}
                    className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm"
                  >
                    {FINGER_NAMES[finger as keyof FingerSizes]}: {size}mm
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 컬러 & 요청사항 */}
        {(data.desiredColor || data.request) && (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">스타일 요청</h3>
              <button
                onClick={() => onEdit(3)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            </div>
            {data.desiredColor && (
              <div className="mb-3">
                <p className="text-xs text-gray-500">원하는 컬러</p>
                <p className="text-sm text-gray-900 mt-1">{data.desiredColor}</p>
              </div>
            )}
            {data.request && (
              <div>
                <p className="text-xs text-gray-500">요청사항</p>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{data.request}</p>
              </div>
            )}
          </div>
        )}

        {/* 첨부 이미지 */}
        {data.attachments.length > 0 && (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">참고 이미지</h3>
              <button
                onClick={() => onEdit(3)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {data.attachments.map((file, index) => (
                <div
                  key={index}
                  className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                >
                  {file.type.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`참고 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 수령 희망일 */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">수령 희망일</h3>
            <button
              onClick={() => onEdit(4)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-900">{formatDate(data.desiredDate)}</p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white pt-4 pb-6 -mx-5 px-5 border-t mt-6">
        <OrderStepButton
          onClick={onSubmit}
          loading={submitting}
          disabled={submitting}
        >
          주문서 보내기
        </OrderStepButton>
        <p className="text-xs text-gray-400 text-center mt-3">
          주문서 제출 후 판매자가 확인하면 채팅으로 안내해드려요
        </p>
      </div>
    </OrderStepLayout>
  );
}
