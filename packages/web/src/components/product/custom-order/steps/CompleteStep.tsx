import { FaCheckCircle, FaComments, FaShoppingBag } from 'react-icons/fa';
import { NAIL_SHAPE_NAME, NAIL_LENGTH_NAME, NailShape, NailLength, CreateCustomOrderResponse } from '@handy-platform/shared';
import { getChatRoomPath } from '../../../../lib/chat/orderChatService';

interface CompleteStepProps {
  orderData: CreateCustomOrderResponse | null;
  chatRoomId: string | null;
  /** 주문은 접수됐지만 채팅으로 판매자에게 전달되지 못한 경우 */
  chatDeliveryFailed?: boolean;
  onGoToChat: () => void;
  onContinueShopping: () => void;
}

export function CompleteStep({
  orderData,
  chatRoomId,
  chatDeliveryFailed = false,
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
      <p className="text-muted text-center mb-8 max-w-xs">
        판매자가 주문서를 확인하면<br />
        채팅으로 연락드릴 예정이에요.
      </p>

      {/* 채팅 전달 실패 안내 — 주문은 접수됐지만 판매자가 아직 못 받은 상태 */}
      {chatDeliveryFailed && (
        <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            주문은 접수됐지만 판매자에게 채팅으로 전달하지 못했습니다.
            채팅방을 열어 주문서를 다시 보내주세요.
          </p>
        </div>
      )}

      {/* 주문 요약 */}
      {orderData && (
        <div className="w-full max-w-sm bg-surface rounded-2xl p-5 mb-8">
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
            className="w-full py-4 bg-brand text-white rounded-full font-semibold
                     flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors"
          >
            <FaComments className="w-5 h-5" />
            채팅으로 이동
          </button>
        )}
        <button
          onClick={onContinueShopping}
          className="w-full py-4 bg-surface text-ink rounded-full font-semibold
                   flex items-center justify-center gap-2 hover:bg-surface-strong transition-colors"
        >
          <FaShoppingBag className="w-5 h-5" />
          계속 쇼핑하기
        </button>
      </div>
    </div>
  );
}
