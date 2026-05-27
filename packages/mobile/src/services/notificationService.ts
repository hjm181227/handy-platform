import { Platform, PermissionsAndroid, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_CONFIG,
  getCurrentEnvironment,
} from '@handy-platform/shared/src/config/api';
import { getChatServiceNative } from '@handy-platform/shared/src/services/chat/ChatService.native';

// Firebase/Notifee — lazy require로 GoogleService-Info.plist 미설정 시 안전하게 스킵
let messaging: any = null;
let notifee: any = null;
let AndroidImportance: any = {};
let firebaseAvailable = false;

try {
  messaging = require('@react-native-firebase/messaging').default;
  notifee = require('@notifee/react-native').default;
  AndroidImportance = require('@notifee/react-native').AndroidImportance;
  // messaging()을 한 번 호출해봐서 Firebase App이 초기화되었는지 확인
  messaging();
  firebaseAvailable = true;
} catch (e: any) {
  console.warn('[NotificationService] Firebase not available — push notifications disabled:', e.message);
}

const CHANNEL_ID = 'chat-messages';
const CHANNEL_NAME = '채팅 메시지';
const SETTINGS_KEY = 'notification_settings';
const STORED_TOKEN_KEY = 'fcm_device_token';

interface NotificationSettings {
  orders: boolean;
  promotions: boolean;
  chat: boolean;
}

interface ChatPushPayload {
  type: 'chat_message';
  roomId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  body: string;
}

class NotificationService {
  private static instance: NotificationService;
  private channelCreated = false;
  private foregroundUnsubscribe: (() => void) | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private notificationOpenedUnsubscribe: (() => void) | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 앱 부팅 시 호출. 알림 채널 생성 + 포그라운드/탭 핸들러 등록.
   * 멱등 — 중복 호출 안전.
   */
  async initialize(): Promise<void> {
    if (!firebaseAvailable) {
      console.warn('[NotificationService] Skipping initialize — Firebase not available');
      return;
    }
    console.log('🔔 [NotificationService] Initializing — Firebase is available');
    await this.ensureChannel();
    this.setupForegroundHandler();
    this.setupTokenRefreshHandler();
    this.setupNotificationOpenedHandler();
    await this.checkInitialNotification();

    // 초기화 시 FCM 토큰 발급 확인
    try {
      await this.getDeviceToken();
    } catch (e) {
      console.warn('[NotificationService] Init token fetch failed:', e);
    }
  }

  /**
   * Android 알림 채널 생성 (멱등).
   * Android 8.0+에서는 채널 없이는 알림이 표시되지 않음.
   */
  private async ensureChannel(): Promise<void> {
    if (this.channelCreated) return;
    if (Platform.OS !== 'android') {
      this.channelCreated = true;
      return;
    }
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    this.channelCreated = true;
  }

  /**
   * 알림 권한 요청. Android 13+에서는 POST_NOTIFICATIONS, 그 이하는 자동 허용.
   * iOS는 Apple 권한 다이얼로그 표시.
   */
  async requestPermission(): Promise<boolean> {
    if (!firebaseAvailable) return false;
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            'android.permission.POST_NOTIFICATIONS' as any,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }
      const authStatus = await messaging().requestPermission();
      const AuthorizationStatus = require('@react-native-firebase/messaging').AuthorizationStatus;
      const granted = (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      );
      console.log('🔔 [NotificationService] iOS permission result:', authStatus, 'granted:', granted);
      return granted;
    } catch (e) {
      console.warn('[NotificationService] Permission request failed:', e);
      return false;
    }
  }

  /**
   * FCM 디바이스 토큰 조회 (없으면 발급)
   */
  async getDeviceToken(): Promise<string | null> {
    if (!firebaseAvailable) return null;
    try {
      const token = await messaging().getToken();
      console.log('🔔 [NotificationService] FCM token acquired:', token ? 'yes' : 'no');
      return token || null;
    } catch (e) {
      console.warn('[NotificationService] Failed to get FCM token:', e);
      return null;
    }
  }

  /**
   * 채팅 서버에 디바이스 토큰 등록
   * - 메인 서버 access token을 그대로 Bearer 헤더로 사용 (채팅 서버가 같은 시크릿으로 검증)
   */
  async registerToken(accessToken: string): Promise<boolean> {
    try {
      const fcmToken = await this.getDeviceToken();
      if (!fcmToken) {
        console.warn('🔔 [NotificationService] No FCM token available, skipping registration');
        return false;
      }
      console.log('🔔 [NotificationService] Registering FCM token to chat server...');

      const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
      const url = this.getChatApiUrl() + '/push/tokens';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: fcmToken, platform }),
      });

      if (!res.ok) {
        console.warn(
          '[NotificationService] Token register failed:',
          res.status,
          await res.text().catch(() => ''),
        );
        return false;
      }
      await AsyncStorage.setItem(STORED_TOKEN_KEY, fcmToken);
      return true;
    } catch (e) {
      console.warn('[NotificationService] registerToken error:', e);
      return false;
    }
  }

  /**
   * 채팅 서버에서 디바이스 토큰 해제 (로그아웃 시)
   */
  async unregisterToken(accessToken: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORED_TOKEN_KEY);
      const token = stored || (await this.getDeviceToken());
      if (!token) return;

      const url = this.getChatApiUrl() + '/push/tokens/' + encodeURIComponent(token);
      await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      await AsyncStorage.removeItem(STORED_TOKEN_KEY);
    } catch (e) {
      console.warn('[NotificationService] unregisterToken error:', e);
    }
  }

  /**
   * 포그라운드 메시지 핸들러
   * - 같은 방을 보고 있으면 표시 생략 (이미 socket으로 메시지 수신)
   * - 아니면 Notifee로 OS 알림 표시
   */
  private setupForegroundHandler(): void {
    if (this.foregroundUnsubscribe) return;
    this.foregroundUnsubscribe = messaging().onMessage(
      async (remoteMessage: any) => {
        const payload = this.parsePayload(remoteMessage);
        if (!payload) return;

        if (this.shouldSuppress(payload)) {
          console.log(
            '[NotificationService] Suppressed (viewing same room):',
            payload.roomId,
          );
          return;
        }
        await this.displayChatNotification(payload);
      },
    );
  }

  /**
   * FCM 토큰 갱신 시 자동 재등록 (저장된 access token 활용)
   */
  private setupTokenRefreshHandler(): void {
    if (this.tokenRefreshUnsubscribe) return;
    this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (newToken: string) => {
      console.log('[NotificationService] FCM token refreshed');
      await AsyncStorage.setItem(STORED_TOKEN_KEY, newToken);
      // 재등록은 호출 측에서 access token을 가지고 다시 호출해야 하므로
      // DeviceEventEmitter로 알림. 인증 컨텍스트가 처리.
      DeviceEventEmitter.emit('fcmTokenRefreshed', { token: newToken });
    });
  }

  /**
   * 알림 탭 처리:
   * 1) 백그라운드 → 포그라운드 복귀: onNotificationOpenedApp
   * 2) 콜드 스타트: getInitialNotification (initialize에서 따로 호출)
   */
  private setupNotificationOpenedHandler(): void {
    if (this.notificationOpenedUnsubscribe) return;
    this.notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp(
      (remoteMessage: any | null) => {
        const payload = this.parsePayload(remoteMessage);
        if (payload) this.routeToChat(payload);
      },
    );
  }

  /**
   * 콜드 스타트 시 알림으로 앱이 열렸는지 확인
   */
  private async checkInitialNotification(): Promise<void> {
    try {
      const initial = await messaging().getInitialNotification();
      if (initial) {
        const payload = this.parsePayload(initial);
        if (payload) {
          // 앱이 완전히 로드된 후 라우팅 (HomeScreen의 navigateToUrl 리스너가 준비된 뒤)
          setTimeout(() => this.routeToChat(payload), 800);
        }
      }
    } catch (e) {
      console.warn('[NotificationService] checkInitialNotification failed:', e);
    }
  }

  /**
   * 알림 탭 시 라우팅:
   * - 1:1 채팅이므로 senderId가 곧 partner. 웹 라우트는 /chat/{partnerId}.
   */
  private routeToChat(payload: ChatPushPayload): void {
    const url = `/chat/${payload.senderId}?name=${encodeURIComponent(
      payload.senderName,
    )}`;
    DeviceEventEmitter.emit('navigateToUrl', { url });
  }

  /**
   * Notifee로 OS 알림 표시
   */
  async displayChatNotification(payload: ChatPushPayload): Promise<void> {
    await this.ensureChannel();
    await notifee.displayNotification({
      title: payload.senderName,
      body: payload.body,
      data: {
        roomId: payload.roomId,
        messageId: payload.messageId,
        senderId: payload.senderId,
        senderName: payload.senderName,
        type: 'chat_message',
      },
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    });
  }

  /**
   * 푸시 페이로드 파싱 (chat_message 타입만 인식)
   */
  private parsePayload(
    remoteMessage: any | null,
  ): ChatPushPayload | null {
    if (!remoteMessage || !remoteMessage.data) return null;
    const data = remoteMessage.data as Record<string, string>;
    if (data.type !== 'chat_message') return null;
    if (!data.roomId || !data.senderId) return null;
    return {
      type: 'chat_message',
      roomId: String(data.roomId),
      messageId: String(data.messageId || ''),
      senderId: String(data.senderId),
      senderName: String(data.senderName || ''),
      body: String(data.body || ''),
    };
  }

  /**
   * 같은 채팅방을 보고 있으면 알림 억제
   */
  private shouldSuppress(payload: ChatPushPayload): boolean {
    try {
      const chat = getChatServiceNative();
      const currentRoom = chat.getCurrentRoomId();
      return Boolean(currentRoom && currentRoom === payload.roomId);
    } catch {
      return false;
    }
  }

  private getChatApiUrl(): string {
    const env = getCurrentEnvironment();
    return API_CONFIG[env]?.chatURL || API_CONFIG.stage.chatURL;
  }

  // ---- 기존 API 호환 (주문/프로모션 로컬 알림 등) ----

  async showLocalNotification(notification: {
    title: string;
    message: string;
    type?: 'order' | 'promotion' | 'general';
    data?: any;
  }): Promise<void> {
    await this.ensureChannel();
    await notifee.displayNotification({
      title: notification.title,
      body: notification.message,
      data: notification.data,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default', launchActivity: 'default' },
      },
    });
  }

  async scheduleOrderStatusNotification(orderId: string, status: string): Promise<void> {
    const title = '주문 상태 업데이트';
    const message = `주문 #${orderId}가 ${this.getStatusMessage(status)} 상태로 변경되었습니다.`;
    await this.showLocalNotification({ title, message, type: 'order', data: { orderId, status } });
  }

  async schedulePromotionNotification(promotion: any): Promise<void> {
    await this.showLocalNotification({
      title: '특가 혜택 알림',
      message: `${promotion.title} - 지금 확인해보세요!`,
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

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        return {
          orders: parsed.orders ?? true,
          promotions: parsed.promotions ?? true,
          chat: parsed.chat ?? true,
        };
      }
    } catch {
      // ignore
    }
    return { orders: true, promotions: true, chat: true };
  }
}

export const notificationService = NotificationService.getInstance();
