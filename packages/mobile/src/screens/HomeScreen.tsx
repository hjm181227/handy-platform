import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  DeviceEventEmitter,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWebURL, logWebUrlInfo } from '../config/webUrl';
import WebViewBridge from '../components/WebViewBridge';
import { WebView } from 'react-native-webview';
import { useNativeScreen } from '../contexts/NativeScreenProvider';
import { FloatingChatButton } from '../components/FloatingChatButton';

const HomeScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewBridgeRef = useRef<WebView>(null);
  const lastBackPressed = useRef<number>(0);
  const { registerWebView } = useNativeScreen();

  // 중앙화된 웹 URL 사용
  const webURL = getWebURL();

  // 디버깅용 URL 정보 로깅
  useEffect(() => {
    logWebUrlInfo();
  }, []);

  // WebView ref를 NativeScreenProvider에 등록
  useEffect(() => {
    if (webViewBridgeRef.current) {
      registerWebView(webViewBridgeRef);
      console.log('✅ [HOMESCREEN] WebView registered to NativeScreenProvider');
    }
  }, [registerWebView]);

  // DeviceEventEmitter로 URL 네비게이션 수신
  useEffect(() => {
    const urlNavigationListener = DeviceEventEmitter.addListener(
      'navigateToUrl',
      ({ url }: { url: string }) => {
        console.log('📍 [HOMESCREEN] Navigating to URL from event:', url);
        if (webViewBridgeRef.current) {
          webViewBridgeRef.current.injectJavaScript(`
            console.log('Navigating to:', '${url}');
            window.location.href = '${url}';
            true;
          `);
        }
      }
    );

    return () => {
      urlNavigationListener.remove();
    };
  }, []);

  // DeviceEventEmitter로 채팅 닫기 이벤트 수신
  useEffect(() => {
    const closeChatListener = DeviceEventEmitter.addListener(
      'closeChat',
      () => {
        console.log('📍 [HOMESCREEN] closeChat event received, returning to original server');
        if (webViewBridgeRef.current) {
          webViewBridgeRef.current.injectJavaScript(`
            console.log('Navigating back to original server: ${webURL}');
            window.location.href = '${webURL}';
            true;
          `);
        }
      }
    );

    return () => {
      closeChatListener.remove();
    };
  }, [webURL]);

  // 하드웨어 뒤로가기 처리
  useEffect(() => {
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
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);

    // URL 변경에 따른 특별한 처리가 필요한 경우
    if (navState.url.includes('/checkout/success')) {
      Alert.alert('주문 완료', '주문이 성공적으로 완료되었습니다!');
    }
  };

  const handleChatButtonPress = () => {
    console.log('💬 [HOMESCREEN] Navigating to chat');
    if (webViewBridgeRef.current) {
      // 개발 테스트용: 로컬 웹 서버 사용
      // TODO: 배포 시 제거하고 ${webURL}/chat 사용
      const chatUrl = 'http://192.168.45.57:3002/chat';
      console.log('💬 [HOMESCREEN] Chat URL (DEV):', chatUrl);

      webViewBridgeRef.current.injectJavaScript(`
        (function() {
          console.log('[WebView] Navigating to chat:', '${chatUrl}');
          window.location.href = '${chatUrl}';
        })();
        true;
      `);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#fff"
      />
      <View style={styles.webViewContainer}>
        <WebViewBridge
          ref={webViewBridgeRef}
          url={webURL}
          onNavigationStateChange={handleNavigationStateChange}
        />
      </View>
      <FloatingChatButton onPress={handleChatButtonPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewContainer: {
    flex: 1,
  },
});

export default HomeScreen;
