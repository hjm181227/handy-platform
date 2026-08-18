/**
 * Order Chat Service
 * 커스텀 주문과 채팅 연동을 위한 서비스
 */

import type { CreateCustomOrderResponse } from '@handy-platform/shared';
import { config } from '../../config/environment';
import { chatFetch, isChatMarkedDown } from './chatHealth';

// 백엔드 채팅 서버 URL
const CHAT_API_URL = config.chatApiUrl;

export interface SendOrderToChatResult {
  success: boolean;
  roomId?: string;
  error?: string;
  /** 방은 만들어졌지만 메시지 전달에 실패한 경우 true (주문 자체는 접수됨) */
  deliveryFailed?: boolean;
}

/** 메시지 전달 실패 시 사용자에게 보여줄 안내. 주문/견적 자체는 이미 접수된 상태다. */
const DELIVERY_FAILED_MESSAGE =
  '상대방에게 채팅으로 전달하지 못했습니다. 채팅방에서 다시 보내주세요.';

/**
 * 채팅 메시지 POST. 실패 시 예외를 던진다.
 * 커스텀 주문·견적은 채팅이 유일한 전달 경로라 일시 오류에 한 번 재시도한다.
 */
async function postChatMessage(
  token: string,
  body: Record<string, unknown>
): Promise<void> {
  let lastError = '';

  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await chatFetch(`${CHAT_API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'network error';
      continue;
    }

    if (response.ok) return;

    lastError = `HTTP ${response.status}`;
    // 4xx는 재시도해도 같은 결과다 (401/403/400 등)
    if (response.status < 500) break;
  }

  throw new Error(`${DELIVERY_FAILED_MESSAGE} (${lastError})`);
}

/**
 * 커스텀 주문서를 채팅으로 전송
 * 1. 판매자와의 채팅방 생성/조회
 * 2. 주문서 메시지 전송
 *
 * @param sellerUuid 판매자 UUID
 * @param orderData 생성된 커스텀 주문 응답 데이터
 * @returns 채팅방 ID 또는 에러
 */
export async function sendCustomOrderToChat(
  sellerUuid: string,
  orderData: CreateCustomOrderResponse
): Promise<SendOrderToChatResult> {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return { success: false, error: '로그인이 필요합니다' };
  }

  if (isChatMarkedDown()) {
    return { success: false, error: '채팅 서버에 연결할 수 없습니다. 주문은 정상 접수되었으며 알림으로 전달됩니다.' };
  }

  try {
    // 1. 채팅방 생성/조회 (POST /rooms/ensure)
    console.log('[orderChatService] Ensuring chat room with seller:', sellerUuid);

    const ensureResponse = await chatFetch(`${CHAT_API_URL}/rooms/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        partnerId: sellerUuid,
        partnerUsername: orderData.brandName,
      }),
    });

    if (!ensureResponse.ok) {
      const errorText = await ensureResponse.text();
      console.error('[orderChatService] Failed to create/get chat room:', errorText);
      throw new Error('채팅방 생성에 실패했습니다');
    }

    const roomData = await ensureResponse.json();
    const roomId = roomData._id;
    console.log('[orderChatService] Got room ID:', roomId);

    // 2. 주문서 메시지 전송 (POST /messages)
    // 방만 만들어지고 메시지가 실패하면 판매자는 주문서를 영영 받지 못한다.
    // 채팅이 커스텀 주문의 유일한 전달 경로이므로 이 실패는 실패로 보고한다.
    console.log('[orderChatService] Sending custom order message to room:', roomId);

    try {
      await postChatMessage(token, {
        roomId: roomId,
        clientMessageId: `order-${orderData.requestUuid}-${Date.now()}`,
        text: '커스텀 주문서를 보냈습니다',
        messageType: 'custom_order',
        metadata: {
          customOrderId: orderData.requestUuid,
        },
      });
    } catch (deliveryError) {
      console.error('[orderChatService] Order message delivery failed:', deliveryError);
      return {
        success: false,
        deliveryFailed: true,
        roomId: sellerUuid, // 채팅방은 있으므로 사용자가 직접 열어 재전송할 수 있다
        error: deliveryError instanceof Error ? deliveryError.message : DELIVERY_FAILED_MESSAGE,
      };
    }

    return {
      success: true,
      roomId: sellerUuid, // 프론트엔드 라우팅용 (sellerUuid 사용)
    };

  } catch (error) {
    console.error('[orderChatService] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    };
  }
}

/**
 * 견적서 데이터 타입
 */
export interface QuoteData {
  quoteId: string;
  customOrderId: string;
  price: number;
  estimatedDays: number;
  notes?: string;
}

/**
 * 견적서를 채팅으로 전송
 * 1. 구매자와의 채팅방 생성/조회
 * 2. 견적서 메시지 전송
 *
 * @param buyerUuid 구매자 UUID
 * @param quoteData 견적서 데이터
 * @returns 성공 여부
 */
export async function sendQuoteToChat(
  buyerUuid: string,
  quoteData: QuoteData
): Promise<SendOrderToChatResult> {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return { success: false, error: '로그인이 필요합니다' };
  }

  if (isChatMarkedDown()) {
    return { success: false, error: '채팅 서버에 연결할 수 없습니다. 주문은 정상 접수되었으며 알림으로 전달됩니다.' };
  }

  try {
    // 1. 채팅방 생성/조회 (POST /rooms/ensure)
    console.log('[orderChatService] Ensuring chat room with buyer:', buyerUuid);

    const ensureResponse = await chatFetch(`${CHAT_API_URL}/rooms/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ partnerId: buyerUuid }),
    });

    if (!ensureResponse.ok) {
      const errorText = await ensureResponse.text();
      console.error('[orderChatService] Failed to create/get chat room:', errorText);
      throw new Error('채팅방 생성에 실패했습니다');
    }

    const roomData = await ensureResponse.json();
    const roomId = roomData._id;
    console.log('[orderChatService] Got room ID:', roomId);

    // 2. 견적서 메시지 전송 (POST /messages)
    // 구매자는 채팅으로만 견적을 받는다. 전달 실패는 실패로 보고해야
    // 판매자가 "보냈는데 왜 답이 없지" 상태에 빠지지 않는다.
    console.log('[orderChatService] Sending quote message to room:', roomId);

    try {
      await postChatMessage(token, {
        roomId: roomId,
        clientMessageId: `quote-${quoteData.quoteId}-${Date.now()}`,
        text: '견적서를 보냈습니다',
        messageType: 'custom_order',
        metadata: {
          type: 'quote',
          quoteId: quoteData.quoteId,
          customOrderId: quoteData.customOrderId,
        },
      });
    } catch (deliveryError) {
      console.error('[orderChatService] Quote message delivery failed:', deliveryError);
      return {
        success: false,
        deliveryFailed: true,
        roomId: buyerUuid,
        error: deliveryError instanceof Error ? deliveryError.message : DELIVERY_FAILED_MESSAGE,
      };
    }

    return {
      success: true,
      roomId: buyerUuid,
    };

  } catch (error) {
    console.error('[orderChatService] Error sending quote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    };
  }
}

/**
 * 채팅방 ID로 이동할 경로 생성
 */
export function getChatRoomPath(roomId: string): string {
  return `/chat/${roomId}`;
}
