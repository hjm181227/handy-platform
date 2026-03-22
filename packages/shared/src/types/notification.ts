export type NotificationType = 'order_status' | 'point_earned' | 'promotion' | 'system' | 'review' | 'coupon';

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}
