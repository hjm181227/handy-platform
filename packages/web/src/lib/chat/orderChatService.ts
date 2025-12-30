/**
 * Order Chat Service
 * 커스텀 주문과 채팅 연동을 위한 서비스
 */

import type { CreateCustomOrderResponse } from '@handy-platform/shared';

// 백엔드 채팅 서버 URL
const CHAT_API_URL = 'http://16.176.147.141';

export interface SendOrderToChatResult {
  success: boolean;
  roomId?: string;
  error?: string;
}

/**
 * 커스텀 주문서를 채팅으로 전송
 * 1. 판매자와의 채팅방 생성/조회
 * 2. 주문서 메시지 전송 (TODO: 백엔드 API 필요)
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

  try {
    // 1. 채팅방 생성/조회 (POST /rooms/ensure)
    console.log('[orderChatService] Ensuring chat room with seller:', sellerUuid);

    const ensureResponse = await fetch(`${CHAT_API_URL}/rooms/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ partnerId: sellerUuid }),
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
    console.log('[orderChatService] Sending custom order message to room:', roomId);

    const clientMessageId = `order-${orderData.requestUuid}-${Date.now()}`;
    const messageResponse = await fetch(`${CHAT_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomId: roomId,
        clientMessageId: clientMessageId,
        text: '커스텀 주문서를 보냈습니다',
        messageType: 'custom_order',
        metadata: {
          customOrderId: orderData.requestUuid,
        },
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('[orderChatService] Failed to send message:', errorText);
      // 메시지 전송 실패해도 채팅방은 생성되었으므로 부분 성공 처리
      console.warn('[orderChatService] Chat room created but message sending failed');
    } else {
      const messageData = await messageResponse.json();
      console.log('[orderChatService] Message sent successfully:', messageData);
    }

    // 성공 반환 (채팅방 생성 완료)
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

  try {
    // 1. 채팅방 생성/조회 (POST /rooms/ensure)
    console.log('[orderChatService] Ensuring chat room with buyer:', buyerUuid);

    const ensureResponse = await fetch(`${CHAT_API_URL}/rooms/ensure`, {
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
    console.log('[orderChatService] Sending quote message to room:', roomId);

    const clientMessageId = `quote-${quoteData.quoteId}-${Date.now()}`;
    const messageResponse = await fetch(`${CHAT_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomId: roomId,
        clientMessageId: clientMessageId,
        text: '견적서를 보냈습니다',
        messageType: 'custom_order',
        metadata: {
          type: 'quote',
          quoteId: quoteData.quoteId,
          customOrderId: quoteData.customOrderId,
        },
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('[orderChatService] Failed to send quote message:', errorText);
      // 메시지 전송 실패해도 채팅방은 생성되었으므로 부분 성공 처리
      console.warn('[orderChatService] Chat room created but quote message sending failed');
    } else {
      const messageData = await messageResponse.json();
      console.log('[orderChatService] Quote message sent successfully:', messageData);
    }

    // 성공 반환
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
