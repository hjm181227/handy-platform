/**
 * 채팅 신고·차단·방 나가기·메시지 삭제 API 클라이언트.
 */

import { config } from '../../config/environment';
import { chatFetch } from './chatHealth';

const CHAT_API_URL = config.chatApiUrl;

export type ReportReason = 'spam' | 'abuse' | 'fraud' | 'sexual' | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: '스팸·광고',
  abuse: '욕설·괴롭힘',
  fraud: '사기 의심',
  sexual: '음란물',
  other: '기타',
};

export interface ModerationResult {
  success: boolean;
  error?: string;
}

function authHeaders(): Record<string, string> | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** 실패 사유를 사용자에게 보여줄 문구로 바꾼다 */
async function toError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    const message = data?.message ?? data?.error;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length > 0) return String(message[0]);
  } catch {
    // 본문이 JSON이 아니면 기본 문구
  }
  return fallback;
}

async function send(
  path: string,
  init: RequestInit,
  fallbackError: string
): Promise<ModerationResult> {
  const headers = authHeaders();
  if (!headers) return { success: false, error: '로그인이 필요합니다' };

  try {
    const response = await chatFetch(`${CHAT_API_URL}${path}`, { ...init, headers });
    if (!response.ok) {
      return { success: false, error: await toError(response, fallbackError) };
    }
    return { success: true };
  } catch {
    return { success: false, error: '채팅 서버에 연결할 수 없습니다' };
  }
}

export function blockUser(targetUserId: string): Promise<ModerationResult> {
  return send(
    '/blocks',
    { method: 'POST', body: JSON.stringify({ targetUserId }) },
    '차단에 실패했습니다'
  );
}

export function unblockUser(targetUserId: string): Promise<ModerationResult> {
  return send(
    `/blocks/${encodeURIComponent(targetUserId)}`,
    { method: 'DELETE' },
    '차단 해제에 실패했습니다'
  );
}

/** 내가 차단한 사용자 ID 목록 */
export async function fetchBlockedIds(): Promise<string[]> {
  const headers = authHeaders();
  if (!headers) return [];
  try {
    const response = await chatFetch(`${CHAT_API_URL}/blocks`, { headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.blockedIds) ? data.blockedIds : [];
  } catch {
    return [];
  }
}

export function reportUser(input: {
  reportedId: string;
  reason: ReportReason;
  roomId?: string;
  messageId?: string;
  detail?: string;
}): Promise<ModerationResult> {
  return send(
    '/reports',
    { method: 'POST', body: JSON.stringify(input) },
    '신고 접수에 실패했습니다'
  );
}

/** 방 나가기 — 내 목록에서만 숨긴다 */
export function leaveChatRoom(roomId: string): Promise<ModerationResult> {
  return send(
    `/rooms/${encodeURIComponent(roomId)}/leave`,
    { method: 'POST', body: JSON.stringify({}) },
    '나가기에 실패했습니다'
  );
}

/** 내가 보낸 메시지 삭제 */
export function deleteChatMessage(
  roomId: string,
  messageId: string
): Promise<ModerationResult> {
  return send(
    `/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`,
    { method: 'DELETE' },
    '메시지 삭제에 실패했습니다'
  );
}
