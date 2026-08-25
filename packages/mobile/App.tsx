import React, { useEffect } from 'react';
import { Linking, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeScreenProvider } from './src/contexts/NativeScreenProvider';
import HomeScreen from './src/screens/HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './src/services/notificationService';

const App: React.FC = () => {
  useEffect(() => {
    // 앱 시작 시 초기화
    initializeApp();

    // Deep Link 처리 (OAuth 콜백 등)
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 [APP] Deep link received:', url);
      // handyapp://oauth-callback?stateId=xxx
      if (url.startsWith('handyapp://oauth-callback')) {
        try {
          const queryString = url.split('?')[1] || '';
          const params = queryString.split('&').reduce((acc: Record<string, string>, pair: string) => {
            const [key, value] = pair.split('=');
            if (key && value) acc[key] = decodeURIComponent(value);
            return acc;
          }, {} as Record<string, string>);
          const stateId = params.stateId;
          const provider = params.provider || 'google';
          if (stateId) {
            console.log('🔗 [APP] OAuth callback stateId:', stateId, 'provider:', provider);
            DeviceEventEmitter.emit('navigateToUrl', {
              url: `/auth/${provider}/callback?stateId=${stateId}`
            });
          }
        } catch (e) {
          console.error('🔴 [APP] Deep link parsing error:', e);
        }
      }
    };

    // 앱이 실행 중일 때 Deep Link 수신
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // 앱이 종료 상태에서 Deep Link로 실행된 경우
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // 카메라·사진 권한은 실제 사용 시점(측정 화면, 사진 첨부)에 요청한다.

      // 푸시 알림 채널/핸들러 초기화 (콜드 스타트 알림 라우팅 포함)
      await notificationService.initialize();

      // 이미 로그인된 사용자면 FCM 토큰 등록 + 권한 요청
      const accessToken = await AsyncStorage.getItem('@handy_platform:accessToken');
      if (accessToken) {
        const granted = await notificationService.requestPermission();
        if (granted) {
          notificationService.registerToken(accessToken);
        }
      }

      // FCM 토큰 갱신 시 자동 재등록
      const tokenRefreshSub = DeviceEventEmitter.addListener(
        'fcmTokenRefreshed',
        async () => {
          const currentToken = await AsyncStorage.getItem('@handy_platform:accessToken');
          if (currentToken) {
            notificationService.registerToken(currentToken);
          }
        },
      );
      // App 컴포넌트가 unmount될 일이 거의 없지만, 안전하게 cleanup
      (initializeApp as any).__tokenRefreshSub = tokenRefreshSub;
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <NativeScreenProvider>
        <HomeScreen />
      </NativeScreenProvider>
    </SafeAreaProvider>
  );
};

export default App;
