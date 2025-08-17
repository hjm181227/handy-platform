import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import WebViewBridge from '../components/WebViewBridge';

const HomeScreen: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false);
  
  // 개발 환경에서는 로컬 웹서버, 프로덕션에서는 실제 웹사이트 URL
  const webURL = __DEV__ 
    ? 'http://localhost:3000' // Vite 개발 서버
    : 'https://your-shopping-website.com'; // 실제 쇼핑몰 웹사이트

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