/**
 * 채팅 모듈의 세션 만료 처리.
 *
 * 채팅은 메인 API 클라이언트(services/api)를 거치지 않고 fetch를 직접 쓴다.
 * 그래서 액세스 토큰이 만료돼도 그쪽의 만료 처리(토큰 정리 + 로그인 화면 이동)가
 * 돌지 않았다. 401은 useChat의 catch-all에 걸려 "채팅 서버에 연결할 수 없습니다"
 * 라는 엉뚱한 서버 장애 문구로 표시됐고, 사용자는 로그인이 만료된 줄 모른 채
 * 재시도만 반복했다.
 * (2026-09-04 채팅 서버 로그: jwt expired 144건, 서버측 에러는 0건)
 *
 * 서버에 리프레시 엔드포인트가 없으므로(handy-app-server routes/auth.ts는
 * 발급만 한다) 복구 수단은 재로그인뿐이다. 토큰을 지우고 로그인 화면으로 보낸다.
 */

import { webTokenManager } from '../../services/api';

export const SESSION_EXPIRED_MESSAGE = '로그인이 만료되었습니다. 다시 로그인해 주세요.';

/** 채팅 API가 401을 돌려줬을 때 던진다. */
export class ChatSessionExpiredError extends Error {
  constructor() {
    super(SESSION_EXPIRED_MESSAGE);
    this.name = 'ChatSessionExpiredError';
  }
}

export function isSessionExpired(error: unknown): boolean {
  return error instanceof ChatSessionExpiredError;
}

/**
 * 응답이 401이면 ChatSessionExpiredError를 던진다.
 * 403은 차단·권한 문제라 여기서 다루지 않는다 — 로그아웃시키면 안 된다.
 */
export function throwIfSessionExpired(response: Response): void {
  if (response.status === 401) {
    throw new ChatSessionExpiredError();
  }
}

/** 병렬 요청이 동시에 401을 받아도 정리·이동은 한 번만 돈다. */
let isHandling = false;

/**
 * 만료된 세션을 정리하고 로그인 화면으로 보낸다.
 *
 * 이동은 services/apiService의 만료 처리와 같게 전체 페이지 전환으로 한다.
 * 토큰을 지운 것만으로는 이미 렌더된 화면이 다시 그려지지 않아, SPA 라우팅으로는
 * 만료된 화면에 그대로 남는 경우가 생긴다.
 */
export function handleChatSessionExpired(): void {
  if (isHandling) return;
  isHandling = true;

  void webTokenManager.clearTokens().finally(() => {
    window.dispatchEvent(new CustomEvent('authStateChanged'));

    setTimeout(() => {
      isHandling = false;
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, 100);
  });
}
