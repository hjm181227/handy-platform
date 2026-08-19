import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  API_CONFIG,
  CHAT_ENDPOINTS,
  getCurrentEnvironment,
} from '@handy-platform/shared/src/config/api';
import { getChatSocket } from '../lib/chat/ChatSocketService';
import { chatFetch, isChatMarkedDown } from '../lib/chat/chatHealth';

/**
 * 헤더 채팅 버튼 미확인 카운트
 * - 마운트 시: HTTP GET /chat/unread-total로 초기 카운트 동기화
 * - 이후: Socket.IO 'chat:unread-total' 이벤트로 실시간 업데이트
 * - 탭 복귀 시: 추가 1회 HTTP refetch (Socket 재연결 갭 보완)
 *
 * 소켓은 채팅방 화면과 같은 싱글턴(ChatSocketService)을 쓴다. 예전에는 배지가
 * 별도 구현(shared/ChatService.web)을 써서, 방에 들어가 있는 동안 같은 사용자가
 * 소켓 연결을 두 개 물고 있었다.
 */
export function useChatUnreadCount() {
  const [count, setCount] = useState(0);
  const { currentUser } = useAuth();

  const getChatApiUrl = useCallback((): string => {
    const env = getCurrentEnvironment();
    return API_CONFIG[env]?.chatURL || API_CONFIG.stage.chatURL;
  }, []);

  const fetchTotal = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    if (!token || !currentUser) {
      setCount(0);
      return;
    }
    // 서킷브레이커: 채팅 서버가 다운으로 표시돼 있으면 시도 자체를 건너뛴다
    // (꺼진 채팅 서버 때문에 페이지마다 타임아웃을 기다리지 않도록)
    if (isChatMarkedDown()) {
      return;
    }
    try {
      const url = getChatApiUrl() + CHAT_ENDPOINTS.UNREAD_TOTAL;
      const res = await chatFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCount(0);
        return;
      }
      const data = (await res.json()) as { total?: number };
      setCount(typeof data.total === 'number' ? data.total : 0);
    } catch {
      // 조용히 실패 — 다음 폴링/이벤트에서 회복
    }
  }, [currentUser, getChatApiUrl]);

  useEffect(() => {
    if (!currentUser) {
      setCount(0);
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setCount(0);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    // 탭 복귀 시 refetch (소켓 재연결 갭 보완). fetchTotal이 서킷브레이커를
    // 확인하므로 다운 상태에서는 조용히 건너뛴다.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchTotal();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 1) 초기 fetch
    void fetchTotal();

    // 2) Socket 연결 + 이벤트 구독 (서버가 user:${userId} 룸에 자동 join 시킴)
    // 채팅 서버 다운 상태면 소켓 연결은 시도하지 않는다 (탭 복귀 refetch가
    // 성공하면 다운 표시가 풀리고, 다음 마운트부터 소켓이 다시 붙는다)
    if (!isChatMarkedDown()) {
      const chat = getChatSocket();
      // 구독을 먼저 걸어야 연결 직후 도착하는 이벤트를 놓치지 않는다
      unsubscribe = chat.onUnreadTotal(({ total }) => {
        setCount(typeof total === 'number' ? total : 0);
      });
      chat.connect({ token }).catch((e) => {
        console.warn('[useChatUnreadCount] Socket connect failed:', e);
      });
      // 재연결되면 그동안 놓친 변화를 HTTP로 한 번 맞춘다
      const unsubscribeConnect = chat.onConnect(() => {
        if (!cancelled) void fetchTotal();
      });
      const prevUnsubscribe = unsubscribe;
      unsubscribe = () => {
        prevUnsubscribe();
        unsubscribeConnect();
      };
    }

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [currentUser, fetchTotal]);

  return { count, refetch: fetchTotal };
}
