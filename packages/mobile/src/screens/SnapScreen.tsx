import React, { useRef, useState } from 'react';
import { StyleSheet, BackHandler, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWebURL } from '../config/webUrl';
import WebViewBridge from '../components/WebViewBridge';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const SnapScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewBridgeRef = useRef<WebView>(null);
  const lastBackPressed = useRef<number>(0);

  // 중앙화된 웹 URL 사용 (스냅 페이지)
  const getSnapPageURL = () => {
    return `${getWebURL()}/snap`;
  };

  // 하드웨어 뒤로가기 처리
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewBridgeRef.current) {
          // WebView에 히스토리가 있으면 뒤로가기
          webViewBridgeRef.current.goBack();
          return true;
        } else {
          // WebView 초기 페이지이거나 히스토리가 없을 때 - 2번 탭하면 앱 종료
          const currentTime = Date.now();
          if (currentTime - lastBackPressed.current < 2000) {
            // 2초 이내에 두 번째 뒤로가기 - 앱 종료
            BackHandler.exitApp();
            return true;
          } else {
            // 첫 번째 뒤로가기 - 토스트 메시지
            lastBackPressed.current = currentTime;
            if (Platform.OS === 'android') {
              ToastAndroid.show('한 번 더 누르면 종료됩니다', ToastAndroid.SHORT);
            }
            return true;
          }
        }
      });

      return () => backHandler.remove();
    }, [canGoBack])
  );

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebViewBridge
        ref={webViewBridgeRef}
        url={getSnapPageURL()}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default SnapScreen;