import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { getCurrentEnvironment } from '@handy-platform/shared';
import WebViewBridge from '../components/WebViewBridge';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const HomeScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewBridgeRef = useRef<WebView>(null);
  const navigation = useNavigation();
  
  // 환경별 웹 URL 설정
  const getWebURL = () => {
    const env = getCurrentEnvironment();

    if (env === 'development') {
      return Platform.OS === 'android'
        ? 'http://10.0.2.2:3003' // Android 에뮬레이터용 IP:포트
        : 'http://localhost:3003'; // iOS 시뮬레이터용
    } else {
      // 프로덕션 환경
      return Platform.OS === 'android'
        ? 'http://10.0.2.2:3003' // Android 에뮬레이터용 IP:포트
        : 'http://localhost:3003'; // iOS 시뮬레이터용
    }
  };

  const webURL = getWebURL();

  // 홈 탭 클릭 이벤트 리스너 - Updated
  useEffect(() => {
    const homeTabListener = DeviceEventEmitter.addListener('homeTabPressed', () => {
      console.log('Home tab pressed event received!');
      if (webViewBridgeRef.current) {
        console.log('Navigating webview to home...');
        webViewBridgeRef.current.injectJavaScript(`
          console.log('Current URL before navigation:', window.location.href);
          window.location.href = '/';
          true;
        `);
      }
    });

    return () => {
      homeTabListener.remove();
    };
  }, []);

  // 홈 탭을 누를 때마다 메인 홈으로 이동
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 [HOMESCREEN] HomeScreen useFocusEffect triggered');
      console.log('🏠 [HOMESCREEN] Current navigation state:', navigation.getState());
      
      // 현재 활성화된 탭이 Home인지 확인
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];
      console.log('🏠 [HOMESCREEN] Current route:', currentRoute.name);
      
      if (currentRoute.name !== 'Home') {
        console.log('🏠 [HOMESCREEN] Current tab is not Home, skipping navigation');
        return;
      }
      
      const timer = setTimeout(() => {
        if (webViewBridgeRef.current && navigation.isFocused() && currentRoute.name === 'Home') {
          console.log('🏠 [HOMESCREEN] All checks passed - navigating to home');
          // 홈 페이지로 강제 이동
          webViewBridgeRef.current.injectJavaScript(`
            console.log('Current URL:', window.location.href);
            console.log('Current pathname:', window.location.pathname);
            
            // 강제로 홈으로 이동
            window.location.href = '/';
            
            true;
          `);
        } else {
          console.log('🏠 [HOMESCREEN] Checks failed - skipping navigation');
          console.log('🏠 [HOMESCREEN] WebView ref:', !!webViewBridgeRef.current);
          console.log('🏠 [HOMESCREEN] Is focused:', navigation.isFocused());
          console.log('🏠 [HOMESCREEN] Current route:', currentRoute.name);
        }
      }, 100); // 100ms 지연 후 실행

      return () => clearTimeout(timer);
    }, [navigation])
  );

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // URL 변경에 따른 특별한 처리가 필요한 경우
    if (navState.url.includes('/checkout/success')) {
      Alert.alert('주문 완료', '주문이 성공적으로 완료되었습니다!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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