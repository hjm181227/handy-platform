import React, { useEffect, useState } from 'react';
import type { Notification } from '@handy-platform/shared';
import { notificationService } from '../../services/notificationService';
import { PageHeader } from '../layout/PageHeader';

interface Props {
  onGo: (to: string) => void;
}

export function NotificationsInboxPage({ onGo }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (nextPage = page) => {
    try {
      setLoading(true);
      setError('');
      const response = await notificationService.getNotifications(nextPage, 20);
      setNotifications(response.notifications || []);
      setPage(response.pagination?.page || nextPage);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (requestError: any) {
      setError(requestError?.message || '알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const announceChange = () => window.dispatchEvent(new Event('notifications:changed'));

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification._id).catch(() => undefined);
      setNotifications(current => current.map(item => item._id === notification._id ? { ...item, isRead: true } : item));
      announceChange();
    }
    const route = notification.data?.route;
    if (typeof route === 'string' && route.startsWith('/')) onGo(route);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(current => current.map(item => ({ ...item, isRead: true })));
    announceChange();
  };

  const remove = async (event: React.MouseEvent, notificationId: string) => {
    event.stopPropagation();
    await notificationService.deleteNotification(notificationId);
    setNotifications(current => current.filter(item => item._id !== notificationId));
    announceChange();
  };

  const hasUnread = notifications.some(notification => !notification.isRead);

  return (
    <main className="min-h-screen bg-[#FAF8F7]">
      <PageHeader onBack={() => onGo('/my')} title="알림" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">새 소식</h1>
            <p className="mt-1 text-sm text-gray-500">주문과 입점 신청의 중요한 변경 사항을 확인하세요.</p>
          </div>
          {hasUnread && <button onClick={markAllAsRead} className="text-sm font-semibold text-[#D14A5B]">모두 읽음</button>}
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-5">{[1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">✓</div>
              <p className="mt-4 font-semibold text-gray-900">새로운 알림이 없습니다</p>
              <p className="mt-1 text-sm text-gray-500">중요한 소식이 생기면 이곳에서 알려드릴게요.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <button
                  key={notification._id}
                  onClick={() => openNotification(notification)}
                  className={`group flex w-full gap-4 p-5 text-left transition hover:bg-gray-50 ${notification.isRead ? 'bg-white' : 'bg-[#FFF8F8]'}`}
                >
                  <div className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${notification.isRead ? 'bg-gray-200' : 'bg-[#E85A6B]'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm ${notification.isRead ? 'font-medium text-gray-800' : 'font-bold text-gray-950'}`}>{notification.title}</p>
                      <span className="flex-none text-xs text-gray-400">{new Date(notification.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-gray-600">{notification.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      {notification.data?.route ? <span className="text-xs font-semibold text-[#D14A5B]">자세히 보기 →</span> : <span />}
                      <span onClick={(event) => remove(event, notification._id)} className="text-xs text-gray-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100">삭제</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <nav className="mt-5 flex items-center justify-center gap-3">
            <button disabled={page <= 1 || loading} onClick={() => load(page - 1)} className="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40">이전</button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages || loading} onClick={() => load(page + 1)} className="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40">다음</button>
          </nav>
        )}
      </div>
    </main>
  );
}
