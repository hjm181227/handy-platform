import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { getCurrentEnvironment } from '@handy-platform/shared';
import WebViewBridge from '../components/WebViewBridge';

const HomeScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  
  // 환경별 웹 URL 설정
  const getWebURL = () => {
    const env = getCurrentEnvironment();
    
    if (env === 'development') {
      return Platform.OS === 'android' 
        ? 'http://10.0.2.2:3001' // Android 에뮬레이터용 IP:포트
        : 'http://localhost:3001'; // iOS 시뮬레이터용
    } else {
      // 프로덕션 환경 - 실제 배포된 웹사이트 URL
      return 'https://your-production-website.com';
    }
  };

  const webURL = getWebURL();

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