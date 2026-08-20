/**
 * 상담 어시스턴트 API 클라이언트 — 채팅 초안 다듬기.
 *
 * 채팅서버의 /assist/* 를 호출한다. 이 기능이 실패해도 채팅 자체에는
 * 영향이 없어야 하므로, 모든 실패는 { success: false, error } 로 흡수한다.
 */

import { config } from '../../config/environment';
import { chatFetch } from './chatHealth';

const CHAT_API_URL = config.chatApiUrl;

/** 상태 캐시 TTL — 방을 오갈 때마다 서버를 두드리지 않는다 */
const STATUS_CACHE_TTL_MS = 5 * 60 * 1000;

export interface AssistStatus {
  enabled: boolean;
  isSeller: boolean;
}

export type RefineResult =
  | { success: true; refined: string }
  | { success: false; error: string };

function authHeaders(): Record<string, string> | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

let statusCache: { value: AssistStatus; expiresAt: number } | null = null;

/**
 * ✨ 버튼 노출 여부. 기능 플래그가 꺼져 있거나, 셀러 전용 롤아웃에서
 * 셀러가 아니면 enabled=false. 실패 시에도 false — 버튼만 숨긴다.
 */
export async function fetchAssistStatus(): Promise<AssistStatus> {
  const now = Date.now();
  if (statusCache && statusCache.expiresAt > now) return statusCache.value;

  const headers = authHeaders();
  if (!headers) return { enabled: false, isSeller: false };

  try {
    const response = await chatFetch(`${CHAT_API_URL}/assist/status`, { headers });
    if (!response.ok) return { enabled: false, isSeller: false };
    const data = await response.json();
    const value: AssistStatus = {
      enabled: data.enabled === true,
      isSeller: data.isSeller === true,
    };
    statusCache = { value, expiresAt: now + STATUS_CACHE_TTL_MS };
    return value;
  } catch {
    return { enabled: false, isSeller: false };
  }
}

/** 초안을 다듬는다. 결과는 사용자가 확인·수정 후 직접 전송한다. */
export async function refineDraft(roomId: string, draft: string): Promise<RefineResult> {
  const headers = authHeaders();
  if (!headers) return { success: false, error: '로그인이 필요합니다' };

  try {
    const response = await chatFetch(`${CHAT_API_URL}/assist/refine`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ roomId, draft }),
    });

    if (response.ok) {
      const data = await response.json();
      if (typeof data.refined === 'string' && data.refined.trim()) {
        return { success: true, refined: data.refined };
      }
      return { success: false, error: '다듬기 결과를 받지 못했습니다' };
    }

    // 서버가 내려주는 code/scope 별로 사용자 문구를 다르게 안내한다
    let scope: string | undefined;
    try {
      const body = await response.json();
      scope = body?.scope;
    } catch {
      // 본문 없음
    }

    if (response.status === 429) {
      return {
        success: false,
        error:
          scope === 'daily'
            ? '오늘 사용 한도를 모두 사용했습니다'
            : '요청이 많아요. 잠시 후 다시 시도해 주세요',
      };
    }
    if (response.status === 403) {
      return { success: false, error: '지금은 셀러만 사용할 수 있는 기능입니다' };
    }
    return { success: false, error: '지금은 다듬기를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요' };
  } catch {
    return { success: false, error: '채팅 서버에 연결할 수 없습니다' };
  }
}
