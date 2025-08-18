import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationData {
  title: string;
  message: string;
  type?: 'order' | 'promotion' | 'general';
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async showLocalNotification(notification: NotificationData) {
    // 간단한 알림 표시 (추후 react-native-push-notification 등으로 확장 가능)
    Alert.alert(notification.title, notification.message);
  }

  async scheduleOrderStatusNotification(orderId: string, status: string) {
    const title = '주문 상태 업데이트';
    const message = `주문 #${orderId}가 ${this.getStatusMessage(status)} 상태로 변경되었습니다.`;
    
    this.showLocalNotification({
      title,
      message,
      type: 'order',
      data: { orderId, status },
    });
  }

  async schedulePromotionNotification(promotion: any) {
    const title = '특가 혜택 알림';
    const message = `${promotion.title} - 지금 확인해보세요!`;
    
    this.showLocalNotification({
      title,
      message,
      type: 'promotion',
      data: promotion,
    });
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case 'confirmed':
        return '주문 확인';
      case 'shipped':
        return '배송 중';
      case 'delivered':
        return '배송 완료';
      default:
        return status;
    }
  }

  async saveNotificationSettings(settings: { orders: boolean; promotions: boolean }) {
    await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
  }

  async getNotificationSettings(): Promise<{ orders: boolean; promotions: boolean }> {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      return settings ? JSON.parse(settings) : { orders: true, promotions: true };
    } catch {
      return { orders: true, promotions: true };
    }
  }
}

export const notificationService = NotificationService.getInstance();