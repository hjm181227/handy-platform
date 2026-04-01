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
import { i18n } from '@handy-platform/shared';


const HomeScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewBridgeRef = useRef<WebView>(null);
  const lastBackPressed = useRef<number>(0);
  const { registerWebView, openNailSizes } = useNativeScreen();

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
            ToastAndroid.show(i18n.t('common:pressBackAgainToExit') || 'Press back again to exit', ToastAndroid.SHORT);
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
      Alert.alert(
        i18n.t('order:complete.title') || 'Order Complete',
        i18n.t('order:complete.message') || 'Your order has been placed successfully!'
      );
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
      />
      <View style={styles.webViewContainer}>
        <WebViewBridge
          ref={webViewBridgeRef}
          url={webURL}
          onNavigationStateChange={handleNavigationStateChange}
          onShowNativeFeatures={openNailSizes}
        />
      </View>
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
