import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid, Permission, Linking, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeScreenProvider } from './src/contexts/NativeScreenProvider';
import HomeScreen from './src/screens/HomeScreen';

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
          const stateId = queryString.split('&').reduce((acc: string | null, pair: string) => {
            const [key, value] = pair.split('=');
            return key === 'stateId' ? decodeURIComponent(value) : acc;
          }, null as string | null);
          if (stateId) {
            console.log('🔗 [APP] OAuth callback stateId:', stateId);
            DeviceEventEmitter.emit('navigateToUrl', {
              url: `/auth/google/callback?stateId=${stateId}`
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
      // Android 권한 요청
      if (Platform.OS === 'android') {
        await requestAndroidPermissions();
      }

      // 스플래시 스크린 숨기기 (if splash screen package is available)
      // setTimeout(() => {
      //   SplashScreen.hide();
      // }, 1000);
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const requestAndroidPermissions = async () => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ].filter(Boolean) as Permission[];

      await PermissionsAndroid.requestMultiple(permissions);
    } catch (error) {
      console.error('Permission request error:', error);
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