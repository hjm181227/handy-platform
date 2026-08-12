import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  const { currentUser } = useAuth();

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setCount(0);
      return;
    }
    try {
      const unread = await notificationService.getUnreadCount();
      setCount(unread);
    } catch {
      // 조용히 실패
    }
  }, [currentUser]);

  useEffect(() => {
    refresh();
    window.addEventListener('notifications:changed', refresh);
    // 60초마다 폴링
    const interval = setInterval(refresh, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:changed', refresh);
    };
  }, [refresh]);

  return { count, refresh };
}

export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
      {count > 99 ? '99+' : count}
    </span>
  );
}
