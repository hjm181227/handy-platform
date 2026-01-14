import { FaCheckCircle, FaComments, FaShoppingBag } from 'react-icons/fa';
import { NAIL_SHAPE_NAME, NAIL_LENGTH_NAME, NailShape, NailLength, CreateCustomOrderResponse } from '@handy-platform/shared';
import { getChatRoomPath } from '../../../../lib/chat/orderChatService';

interface CompleteStepProps {
  orderData: CreateCustomOrderResponse | null;
  chatRoomId: string | null;
  onGoToChat: () => void;
  onContinueShopping: () => void;
}

export function CompleteStep({
  orderData,
  chatRoomId,
  onGoToChat,
  onContinueShopping,
}: CompleteStepProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      {/* 성공 아이콘 */}
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <FaCheckCircle className="w-12 h-12 text-green-500" />
      </div>

      {/* 성공 메시지 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
        주문서가 전송되었습니다!
      </h1>
      <p className="text-gray-500 text-center mb-8 max-w-xs">
        판매자가 주문서를 확인하면<br />
        채팅으로 연락드릴 예정이에요.
      </p>

      {/* 주문 요약 */}
      {orderData && (
        <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-5 mb-8">
          <p className="font-semibold text-gray-900 mb-2">{orderData.title}</p>
          <div className="flex gap-2 text-sm text-gray-600">
            <span className="bg-white px-2 py-1 rounded">
              {NAIL_SHAPE_NAME[orderData.specifications.shape as NailShape]}
            </span>
            <span className="bg-white px-2 py-1 rounded">
              {NAIL_LENGTH_NAME[orderData.specifications.length as NailLength]}
            </span>
          </div>
        </div>
      )}

      {/* 버튼들 */}
      <div className="w-full max-w-sm space-y-3">
        {chatRoomId && (
          <button
            onClick={onGoToChat}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold
                     flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <FaComments className="w-5 h-5" />
            채팅으로 이동
          </button>
        )}
        <button
          onClick={onContinueShopping}
          className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold
                   flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <FaShoppingBag className="w-5 h-5" />
          계속 쇼핑하기
        </button>
      </div>
    </div>
  );
}
