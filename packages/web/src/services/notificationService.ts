import { webTokenManager } from './api';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await webTokenManager.getValidToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...options?.headers }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const notificationService = {
  async getNotifications(page = 1, limit = 20, type?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set('type', type);
    const res = await fetchJson<any>(`/api/user/notifications?${params}`);
    return res.data;
  },

  async getUnreadCount() {
    const res = await fetchJson<any>('/api/user/notifications/unread-count');
    return res.data.unreadCount;
  },

  async markAsRead(id: string) {
    return fetchJson<any>(`/api/user/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllAsRead() {
    return fetchJson<any>('/api/user/notifications/read-all', { method: 'PATCH' });
  },

  async deleteNotification(id: string) {
    return fetchJson<any>(`/api/user/notifications/${id}`, { method: 'DELETE' });
  }
};
