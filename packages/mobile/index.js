// Buffer 폴리필 (jpeg-js 등 Node.js 라이브러리 호환성)
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import {AppRegistry} from 'react-native';
import App from './App';

// FCM 백그라운드/킬 상태 메시지 핸들러 (RNFB 요구사항: AppRegistry 전에 등록)
// GoogleService-Info.plist / google-services.json 미설정 시 안전하게 스킵
try {
  const messaging = require('@react-native-firebase/messaging').default;
  const notifee = require('@notifee/react-native').default;
  const { AndroidImportance } = require('@notifee/react-native');

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    try {
      const data = remoteMessage?.data || {};
      if (data.type !== 'chat_message') return;

      await notifee.createChannel({
        id: 'chat-messages',
        name: '채팅 메시지',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.displayNotification({
        title: String(data.senderName || ''),
        body: String(data.body || ''),
        data: {
          roomId: String(data.roomId || ''),
          messageId: String(data.messageId || ''),
          senderId: String(data.senderId || ''),
          senderName: String(data.senderName || ''),
          type: 'chat_message',
        },
        android: {
          channelId: 'chat-messages',
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default', launchActivity: 'default' },
        },
        ios: { sound: 'default' },
      });
    } catch (e) {
      console.warn('[backgroundMessageHandler] error:', e);
    }
  });
} catch (e) {
  console.warn('[Firebase] Background handler skipped — Firebase not configured:', e.message);
}

AppRegistry.registerComponent('HandyPlatformApp', () => App);
