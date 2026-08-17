/**
 * 채팅 서버 서킷브레이커.
 *
 * 채팅 서버는 비용 절감을 위해 꺼져 있을 수 있는 "부가 채널"이다.
 * 꺼져 있을 때 배지 폴링·주문서 전송이 페이지마다 브라우저 기본
 * 타임아웃(수십 초)을 기다리며 콘솔 오류를 쌓는 것을 막는다.
 *
 * - 모든 채팅 fetch는 짧은 타임아웃(기본 4초)을 건다
 * - 네트워크 실패/타임아웃이 나면 일정 시간(기본 5분) 동안 "다운"으로
 *   표시하고, 배경성 호출(배지 등)은 시도 자체를 건너뛴다
 * - 사용자가 채팅 화면을 직접 열면 재시도는 허용된다 (수동 경로는
 *   isChatMarkedDown을 확인하지 않으면 된다)
 */

const DOWN_UNTIL_KEY = 'chat:down-until';
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 4000;

export function isChatMarkedDown(): boolean {
  try {
    const until = sessionStorage.getItem(DOWN_UNTIL_KEY);
    return until !== null && Date.now() < Number(until);
  } catch {
    return false;
  }
}

export function markChatDown(cooldownMs: number = DEFAULT_COOLDOWN_MS): void {
  try {
    sessionStorage.setItem(DOWN_UNTIL_KEY, String(Date.now() + cooldownMs));
  } catch {
    // sessionStorage 불가 환경(사파리 시크릿 등)에서는 조용히 무시
  }
}

export function markChatUp(): void {
  try {
    sessionStorage.removeItem(DOWN_UNTIL_KEY);
  } catch {
    // 무시
  }
}

/**
 * 타임아웃과 다운 마킹이 붙은 채팅 전용 fetch.
 * HTTP 에러(4xx/5xx)는 서버가 살아있다는 뜻이므로 다운 처리하지 않는다.
 */
export async function chatFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    markChatUp();
    return response;
  } catch (error) {
    // AbortError(타임아웃) 또는 네트워크 단절 → 채팅 서버 다운으로 간주
    markChatDown();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
